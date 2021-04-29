const CompareFileListsInRepo = artifacts.require(
  "./CompareFileListsInRepo.sol"
);
const exec = require("child_process").exec;
const Tellor = artifacts.require("TellorPlayground.sol");
var fs = require("fs");
var helper = require("./helper");
var rimraf = require("rimraf"); //npm install rimraf
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
  let compareFileListsInRepo;
  let tellorOracle;

  beforeEach("Setup contract for each test", async function () {
    tellorOracle = await Tellor.new();
    compareFileListsInRepo = await CompareFileListsInRepo.new(
      tellorOracle.address
    );
  });

  it("Update Price", async function () {
    const requestId = 1; // assumes the first ID of the list of tellor variable contains what we return, e.g. usd/BTC (in our case, checkflag text)
    // 0. the bounty hunter github name
    // 1. The repository name and commit belonging to the sponsor contract
    // OR let the Tellor oracles scrape this data from the sponsor contract to reduce gas costs.
    // (unless the Tellor oracles cannot find what the bounty hunter contract was that initated this Tellor query,
    // in that case the repository name and commit of the bounty hunter should be passed).

    // -----------------------------------------Specify Tellor Oracles Data Sources ----------------------------
    // specify the repository commits of the sponsor and bounty hunter
    const githubUsernameHunter = "a-t-0";
    const repoNameHunter = "sponsor_example";
    const branchHunter = "attack_in_new_file";
    const commitHunter = "00c16a620847faae3a6b7b1dcc5d4d458f2c7986";

    const githubUsernameSponsor = "a-t-0";
    const repoNameSponsor = "sponsor_example";
    const branchSponsor = "main";
    const commitSponsor = "556c43c2441356971da6b55176a069e9b9497033";

    // -----------------------------------------Specify Temporary input and output (files)------------------------
    // Show the contract contains the logic to identify a correct build fail/pass.
    // If the bounty hunter did not add an additional (attack) file, a uint256 of value 2 is expected
    // from the contract. Otherwise a uint of value 1 is expected.
    const expectedSponsorContractOutput = 2;

    // Specify local output location of curled data
    var testOutputFolder = "curled_test_data";
    var testType = "file_list";
    var testCase = "changed";
    var outputFilepathHunter =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/" +
      testType +
      "_" +
      testCase +
      "_hunter.json";
    var outputFilepathSponsor =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/" +
      testType +
      "_" +
      testCase +
      "_sponsor.json";

    // Empty test output folder before using it
    async function deleteFolder(folder) {
      return new Promise((resolve, reject) => {
        rimraf(folder, () => resolve());
      });
    }
    deleteFolder(testOutputFolder);

    // Manually wait a bit before re-creating folders
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // (Re-)create temporary test output folder for curled data
    helper.createDirIfNotExists(testOutputFolder);
    helper.createDirIfNotExists(testOutputFolder + "/" + testType);
    helper.createDirIfNotExists(
      testOutputFolder + "/" + testType + "/" + testCase
    );

    // -----------------------------------------Specify Curl Commands That Get API Data---------------------------
    // create comand to get file list of hunter repo commit
    var commandToGetHunterFilelist =
      "GET https://api.github.com/repos/" +
      githubUsernameHunter +
      "/" +
      repoNameHunter +
      "/git/trees/" +
      commitHunter +
      "?recursive=1 > " +
      outputFilepathHunter;

    // print command to terminal
    console.log("The shell command that gets the hunter file list is:");
    console.log(commandToGetHunterFilelist);
    console.log("");

    // create comand to get file list of sponsor repo commit
    var commandToGetSponsorFilelist =
      "GET https://api.github.com/repos/" +
      githubUsernameSponsor +
      "/" +
      repoNameSponsor +
      "/git/trees/" +
      commitSponsor +
      "?recursive=1 > " +
      outputFilepathSponsor;

    // print command to terminal
    console.log("The shell command that gets the sponsor file list is:");
    console.log(commandToGetSponsorFilelist);
    console.log("");

    // -----------------------------------------Get The Tellor Oracles Data With Shell --------------------------
    // get file list from hunter repo
    helper
      .execCommand(commandToGetHunterFilelist)
      .then((res) => {
        console.log(
          "Getting filelist from the hunter repository, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "Getting filelist from the hunter repository, please wait 10 seconds.",
          err
        );
      });

    // get file list from sponsor repo
    helper
      .execCommand(commandToGetSponsorFilelist)
      .then((res) => {
        console.log(
          "Getting filelist from the sponsor repository, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "An error occured whilst getting filelist from the sponsor repository:",
          err
        );
      });

    // wait till file is read (it takes a while)
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // -----------------------------------------Process The Tellor Oracles Data -------------------------------------
    // Computing differences in node js
    // Read out the Travis build status that is outputed to a file, from the file.
    var hunterFilelist = JSON.parse(
      fs.readFileSync(outputFilepathHunter, "utf8")
    );
    var sponsorFilelist = JSON.parse(
      fs.readFileSync(outputFilepathSponsor, "utf8")
    );

    var hunterFilepaths = [];
    for (let val of hunterFilelist["tree"]) {
      hunterFilepaths.push(val["path"]);
    }
    var sponsorFilepaths = [];
    for (let val of sponsorFilelist["tree"]) {
      sponsorFilepaths.push(val["path"]);
    }

    // Source: https://stackoverflow.com/questions/13523611/how-to-compare-two-arrays-in-node-js
    // Note: ignored Nan edge case cause file names should not be Nan values
    if (
      hunterFilepaths.length == sponsorFilepaths.length &&
      hunterFilepaths.every(function (u, i) {
        return u === sponsorFilepaths[i];
      })
    ) {
      var filelistsDiffer = false;
    } else {
      var filelistsDiffer = true;
    }
    console.log("filelistsDiffer is:");
    console.log(filelistsDiffer);

    // encode build checkflag
    const encodedDifferenceInFilelist = helper.encode(
      filelistsDiffer + "offset"
    );
    console.log(
      "The numerically encoded list of different files between sponsor repo and bounty hunter repo is (including an offset):"
    );
    console.log(encodedDifferenceInFilelist);
    console.log("");

    // -----------------------------------------Verify the contract returns the correct retrieved value ----------------------------
    // specify the mock value that is fed by the Tellor oracles into the contract:
    const mockValue = encodedDifferenceInFilelist;

    await tellorOracle.submitValue(requestId, mockValue);
    let retrievedVal = await compareFileListsInRepo.readTellorValue(requestId);
    assert.equal(retrievedVal.toString(), expectedSponsorContractOutput);
  });
});
