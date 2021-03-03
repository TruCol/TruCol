const CompareFileContents = artifacts.require("./CompareFileContents.sol");
const exec = require("child_process").exec;
const Tellor = artifacts.require("TellorPlayground.sol");
var fs = require("fs");
var rimraf = require("rimraf");
var urllib = require("urllib");

//Helper function that submits and value and returns a timestamp for easy retrieval
const submitTellorValue = async (tellorOracle, requestId, amount) => {
  //Get the amount of values for that timestamp
  let count = await tellorOracle.getNewValueCountbyRequestId();
  await tellorOracle.submitValue(requestId, amount);
  let time = await getTimestampbyRequestIDandIndex(requestId, count.toString());
  return time.toNumber();
};

contract("UsingTellor Tests", function (accounts) {
  let compareFileContents;
  let tellorOracle;

  beforeEach("Setup contract for each test", async function () {
    tellorOracle = await Tellor.new();
    compareFileContents = await CompareFileContents.new(tellorOracle.address);
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
        return new Promise((resolve, reject) => {
          exec(cmd, (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(stdout);
          });
        });
      };
    }
    var os = new os_func();

    // getting some file
    function doCall(urlToCall, callback) {
      urllib.request(
        urlToCall,
        { wd: "nodejs" },
        function (err, data, response) {
          return callback(data);
        }
      );
    }

    function create_output_dir(dir) {
      var fs = require("fs");

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    }

    // -----------------------------------------Specify Tellor Oracles Data Sources ----------------------------
    // specify the repository commits of the sponsor and bounty hunter
    const github_username_hunter = "a-t-0";
    const repo_name_hunter = "sponsor_example";
    const branch_hunter = "attack_unit_test";
    const commit_hunter = "2bd88d1551a835b12c31d8a392f2ee0bf0977c65";

    const github_username_sponsor = "a-t-0";
    const repo_name_sponsor = "sponsor_example";
    const branch_sponsor = "main";
    const commit_sponsor = "556c43c2441356971da6b55176a069e9b9497033";
    const sponsor_unmutable_filelist_filename = "unmutable_filelist.txt";

    // -----------------------------------------Specify Temporary input and output (files)------------------------
    // Show the contract contains the logic to identify a correct build fail/pass.
    // If the build passes, a uint256 of value 2 is expected
    // from the contract. Otherwise a uint of value 1 is expected.
    const expected_sponsor_contract_output = 1;

    // Specify local output location of curled data
    var test_output_folder = "curled_test_data";
    var test_type = "file_contents";
    var test_case = "unchanged";

    // Empty test output folder before using it
    rimraf(test_output_folder, function () {
      console.log(
        "Removed the old content of the temporary output directory.\n"
      );
    });

    // TODO: do not hardcode the folder deletion time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // (Re-)create temporary test output folder for curled data
    create_output_dir(test_output_folder);
    create_output_dir(test_output_folder + "/" + test_type);
    create_output_dir(test_output_folder + "/" + test_type + "/" + test_case);

    // specify the output directory and filename of the file that contains the differences
    var differences_filename =
      test_output_folder +
      "/" +
      test_type +
      "/" +
      test_case +
      "/" +
      test_type +
      "_" +
      test_case +
      ".txt";

    // Specify output location of the local- and remote list of unmutable files defined by the sponsor
    var sponsor_unmutable_filelist_filepath =
      test_output_folder +
      "/" +
      test_type +
      "/" +
      test_case +
      "/" +
      sponsor_unmutable_filelist_filename;
    var command_to_get_unmutable_filelist =
      "curl \x22https://raw.githubusercontent.com/" +
      github_username_sponsor +
      "/" +
      repo_name_sponsor +
      "/" +
      commit_sponsor +
      "/" +
      sponsor_unmutable_filelist_filename +
      "\x22 > " +
      sponsor_unmutable_filelist_filepath;

    // Specify the output paths for the unter and sponsor files
    var hunter_filecontent_path =
      test_output_folder +
      "/" +
      test_type +
      "/" +
      test_case +
      "/hunter_temp_filecontent.txt";
    var sponsor_filecontent_path =
      test_output_folder +
      "/" +
      test_type +
      "/" +
      test_case +
      "/sponsor_temp_filecontent.txt";

    // -----------------------------------------Specify Curl Commands That Get API Data---------------------------
    // create command that curls the hunter files (based on the filename that is inside the shell variable $line)
    var curl_hunter_files =
      "curl \x22https://raw.githubusercontent.com/" +
      github_username_hunter +
      "/" +
      repo_name_hunter +
      "/" +
      commit_hunter +
      "/$line\x22";

    // create command that curls the sponsor files (based on the filename that is inside the shell variable $line)
    var curl_sponsor_files =
      "curl \x22https://raw.githubusercontent.com/" +
      github_username_sponsor +
      "/" +
      repo_name_sponsor +
      "/" +
      commit_sponsor +
      "/$line\x22";

    // combine the commands that curl a file from the hunter and bounter repository commits respectively, and export the difference
    // in their file content
    var command_per_line =
      curl_hunter_files +
      " > " +
      hunter_filecontent_path +
      " && " +
      curl_sponsor_files +
      " > " +
      sponsor_filecontent_path +
      " && diff " +
      hunter_filecontent_path +
      " " +
      sponsor_filecontent_path +
      " >> " +
      differences_filename;

    // Print the final command that outputs the differences
    console.log(
      "The shell command that curls the bounty hunter file and sponsor file for each specified unmutable file is="
    );
    console.log(command_per_line);
    console.log("");

    // Substitute the difference checking command into a command that loops through file list marked unmutable by the sponsor
    var command =
      "while read line; do " +
      command_per_line +
      "; done < " +
      sponsor_unmutable_filelist_filepath;
    console.log(
      "The differences of each unmutable file is appended to a single differences file with the following shell command:"
    );
    console.log(command);
    console.log("");

    // -----------------------------------------Get The Tellor Oracles Data With Shell --------------------------
    // get unmutable file list from sponsor repo
    os.execCommand(command_to_get_unmutable_filelist)
      .then((res) => {
        console.log(
          "Getting list of unmutable files from the sponsor repository, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "Getting list of unmutable files from the sponsor repository, please wait 10 seconds.",
          err
        );
      });

    // wait till file is read (it takes a while)
    // TODO: do not hardcode the build time, but make it dependend on completion of the os_func function.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // compare differences in file content
    os.execCommand(command)
      .then((res) => {
        console.log(
          "Checking if the bounty hunter changed a file marked 'unmutable' by the sponsor, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "Checking if the bounty hunter changed a file marked 'unmutable' by the sponsor, please wait 10 seconds.",
          err
        );
      });

    // wait till file is read (it takes a while)
    // TODO: do not hardcode the build time, but make it dependend on completion of the os_func function.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // read out the pass/fail status of the repository build from file
    var difference_in_file_lists = fs.readFileSync(differences_filename);
    var string_difference_in_file_lists = difference_in_file_lists.toString();
    console.log(
      "The list of different files in unmutable files should be not void/empty, because this tests an attack of the bounty hunter on the unit test. The detected difference is:"
    );
    console.log(string_difference_in_file_lists);
    console.log("");

    // encode build checkflag
    const encoded_difference_in_file_lists = encode(
      string_difference_in_file_lists + "offset"
    );
    console.log(
      "The numerically encoded list of different files between sponsor repo and bounty hunter repo is (including an offset):"
    );
    console.log(encoded_difference_in_file_lists);
    console.log("");

    // specify the mock value that is fed by the Tellor oracles into the contract:
    const mockValue = encoded_difference_in_file_lists;

    // -----------------------------------------Verify the contract returns the correct retrieved value ----------------------------
    await tellorOracle.submitValue(requestId, mockValue);
    let retrievedVal = await compareFileContents.readTellorValue(requestId);
    assert.equal(retrievedVal.toString(), expected_sponsor_contract_output);
  });
});
