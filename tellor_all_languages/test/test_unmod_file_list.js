const CompareFileListsInRepo = artifacts.require("./CompareFileListsInRepo.sol");
const exec = require('child_process').exec;
const Tellor = artifacts.require("TellorPlayground.sol");
var fs = require('fs');
var rimraf = require("rimraf"); //npm install rimraf
var urllib = require('urllib');


//Helper function that submits and value and returns a timestamp for easy retrieval
const submitTellorValue = async (tellorOracle, requestId, amount) => {
  //Get the amount of values for that timestamp
  let count = await tellorOracle.getNewValueCountbyRequestId();
  await tellorOracle.submitValue(requestId, amount);
  let time = await getTimestampbyRequestIDandIndex(requestId, count.toString());
  return time.toNumber();
};

contract("UsingTellor Tests", function (accounts) {
	let compareFileListsInRepo;
	let tellorOracle;

	beforeEach("Setup contract for each test", async function () {
	tellorOracle = await Tellor.new();
	compareFileListsInRepo = await CompareFileListsInRepo.new(tellorOracle.address);
	});

	it("Update Price", async function () {
	const requestId = 1; // assumes the first ID of the list of tellor variable contains what we return, e.g. usd/BTC (in our case, checkflag text)
	// TODO: change the requestId to two strings: 
	// 0. the bounty hunter github name
	// 1. The repository name and commit belonging to the sponsor contract 
	// OR let the Tellor oracles scrape this data from the sponsor contract to reduce gas costs.
	// (unless the Tellor oracles cannot find what the bounty hunter contract was that initated this Tellor query,
	// in that case the repository name and commit of the bounty hunter should be passed).
    	
    	
	// -----------------------------------------Helper Functions ----------------------------
	// Encode a string to a number 
	// Source: https://stackoverflow.com/questions/14346829/is-there-a-way-to-convert-a-string-to-a-base-10-number-for-encryption
	function encode(string) {
		var number = "0x";
		var length = string.length;
		for (var i = 0; i < length; i++)
			number += string.charCodeAt(i).toString(16);
		return number;
	}    	
    	
    // Function that runs some incoming shell command (not bash)
	function os_func() {
		this.execCommand = function (cmd) {
		    return new Promise((resolve, reject)=> {
		       exec(cmd, (error, stdout, stderr) => {
		         if (error) {
		            reject(error);
		            return;
		        }
		        resolve(stdout)
		       });
		   })
	   }
	}
	var os = new os_func();
	
	// getting some file
	function doCall(urlToCall, callback) {
		urllib.request(urlToCall, { wd: 'nodejs' }, function (err, data, response) {                              
		    return callback(data);
		});
	}

	// creates a temporary output dir for queried data
   	function create_output_dir(dir) {	
		var fs = require('fs');

		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
	}

	// -----------------------------------------Specify Tellor Oracles Data Sources ----------------------------
	// specify the repository commits of the sponsor and bounty hunter
	const github_username_hunter = "a-t-0"	
	const repo_name_hunter = "sponsor_example"
	const branch_hunter = "no_attack_in_new_file"
	const commit_hunter = "d8e518b97cc1a528f49a01081890931403361561"
	
	const github_username_sponsor = "a-t-0"
	const repo_name_sponsor = "sponsor_example"
	const branch_sponsor = "main"
	const commit_sponsor = "556c43c2441356971da6b55176a069e9b9497033"
	
		
	// -----------------------------------------Specify Temporary input and output (files)------------------------
	// Show the contract contains the logic to identify a correct build fail/pass. 
	// If the bounty hunter did not add an additional (attack) file, a uint256 of value 2 is expected
	// from the contract. Otherwise a uint of value 1 is expected.
	const expected_sponsor_contract_output = 1
	
	// Specify local output location of curled data
	var test_output_folder = "curled_test_data"
	var test_type = "file_list"
	var test_case = "changed"
	var output_filepath_hunter = test_output_folder+"/"+test_type+"/"+test_case+"/"+test_type+"_"+test_case+"_hunter.json"
	var output_filepath_sponsor = test_output_folder+"/"+test_type+"/"+test_case+"/"+test_type+"_"+test_case+"_sponsor.json"
	
	// Empty test output folder before using it
	rimraf(test_output_folder, function () { console.log("Removed the old content of the temporary output directory.\n"); });
	
	// TODO: do not hardcode the folder deletion time
	await new Promise(resolve => setTimeout(resolve, 2000));
	
	// (Re-)create temporary test output folder for curled data
	create_output_dir(test_output_folder)
	create_output_dir(test_output_folder+"/"+test_type)
	create_output_dir(test_output_folder+"/"+test_type+"/"+test_case)
	
	
	// -----------------------------------------Specify Curl Commands That Get API Data---------------------------	
	// create comand to get file list of hunter repo commit
	var command_to_get_hunter_filelist = "GET https://api.github.com/repos/"+github_username_hunter+"/"+repo_name_hunter+"/git/trees/"+commit_hunter+"?recursive=1 > "+output_filepath_hunter
	
	// print command to terminal
	console.log("The shell command that gets the hunter file list is:")
	console.log(command_to_get_hunter_filelist)
	console.log("")	
	
	// create comand to get file list of sponsor repo commit
	var command_to_get_sponsor_filelist = "GET https://api.github.com/repos/"+github_username_sponsor+"/"+repo_name_sponsor+"/git/trees/"+commit_sponsor+"?recursive=1 > "+output_filepath_sponsor

	// print command to terminal
	console.log("The shell command that gets the sponsor file list is:")
	console.log(command_to_get_sponsor_filelist)
	console.log("")	
	
	
	// -----------------------------------------Get The Tellor Oracles Data With Shell --------------------------
	// get file list from hunter repo
	os.execCommand(command_to_get_hunter_filelist).then(res=> {
		console.log("Getting filelist from the hunter repository, please wait 10 seconds.", res);
	}).catch(err=> {
		console.log("Getting filelist from the hunter repository, please wait 10 seconds.", err);
	})
			
	// get file list from sponsor repo
	os.execCommand(command_to_get_sponsor_filelist).then(res=> {
		console.log("Getting filelist from the sponsor repository, please wait 10 seconds.", res);
	}).catch(err=> {
		console.log("Getting filelist from the sponsor repository, please wait 10 seconds.", err);
	})		
	
	// wait till file is read (it takes a while)
	// TODO: do not hardcode the build time, but make it dependend on completion of the os_func function. 
	await new Promise(resolve => setTimeout(resolve, 10000));


	// -----------------------------------------Process The Tellor Oracles Data -------------------------------------
	// Computing differences in node js
	// Read out the Travis build status that is outputed to a file, from the file.	
	var hunter_filelist = JSON.parse(fs.readFileSync(output_filepath_hunter, 'utf8'));
	var sponsor_filelist = JSON.parse(fs.readFileSync(output_filepath_sponsor, 'utf8'));
	
	var hunter_filepaths = [];
	for(let val of hunter_filelist["tree"]) {
		hunter_filepaths.push(val["path"]);
	}
	var sponsor_filepaths = [];
	for(let val of sponsor_filelist["tree"]) {
		sponsor_filepaths.push(val["path"]);
	}
	
	// Source: https://stackoverflow.com/questions/13523611/how-to-compare-two-arrays-in-node-js
	// Note: ignored Nan edge case cause file names should not be Nan values
	if (hunter_filepaths.length == sponsor_filepaths.length
		&& hunter_filepaths.every(function(u, i) {
		    return u === sponsor_filepaths[i];
		})
	) {
		var file_lists_differ =  false;
	} else {
	   	var file_lists_differ =  true;
	}
	console.log("file_lists_differ is:")
	console.log(file_lists_differ)
	
	// encode build checkflag
	const encoded_difference_in_file_lists = encode(file_lists_differ+"offset");
	console.log("The numerically encoded list of different files between sponsor repo and bounty hunter repo is (including an offset):")
	console.log(encoded_difference_in_file_lists)
	console.log("")
	
	
	// -----------------------------------------Verify the contract returns the correct retrieved value ----------------------------	
	// specify the mock value that is fed by the Tellor oracles into the contract:
	const mockValue = encoded_difference_in_file_lists;
	
    await tellorOracle.submitValue(requestId, mockValue);
    let retrievedVal = await compareFileListsInRepo.readTellorValue(requestId);
	assert.equal(retrievedVal.toString(), expected_sponsor_contract_output);
  });
});
