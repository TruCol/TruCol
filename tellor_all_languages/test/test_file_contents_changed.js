const CompareFileContents = artifacts.require("./CompareFileContents.sol");
const exec = require("child_process").exec;
const Tellor = artifacts.require("TellorPlayground.sol");
var fs = require("fs");
var helper = require("./helper");
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

    // -----------------------------------------Specify Tellor Oracles Data Sources ----------------------------
    // specify the repository commits of the sponsor and bounty hunter
    const githubUsernameHunter = "a-t-0";
    const repoNameHunter = "sponsor_example";
    const branchHunter = "attack_unit_test";
    const commitHunter = "2bd88d1551a835b12c31d8a392f2ee0bf0977c65";

    const githubUsernameSponsor = "a-t-0";
    const repoNameSponsor = "sponsor_example";
    const branchSponsor = "main";
    const commitSponsor = "556c43c2441356971da6b55176a069e9b9497033";
    const sponsorUnmutableFilelistFilename = "unmutable_filelist.txt";

    // -----------------------------------------Specify Temporary input and output (files)------------------------
    // Show the contract contains the logic to identify a correct build fail/pass.
    // If the build passes, a uint256 of value 2 is expected
    // from the contract. Otherwise a uint of value 1 is expected.
    const expectedSponsorContractOutput = 1;

    // Specify local output location of curled data
    var testOutputFolder = "curled_test_data";
    var testType = "file_contents";
    var testCase = "unchanged";

    // Empty test output folder before using it
    rimraf(testOutputFolder, function () {
      console.log(
        "Removed the old content of the temporary output directory.\n"
      );
    });

    // TODO: do not hardcode the folder deletion time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // (Re-)create temporary test output folder for curled data
    helper.createOutputDir(testOutputFolder);
    helper.createOutputDir(testOutputFolder + "/" + testType);
    helper.createOutputDir(testOutputFolder + "/" + testType + "/" + testCase);

    // specify the output directory and filename of the file that contains the differences
    var differencesFilename =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/" +
      testType +
      "_" +
      testCase +
      ".txt";

    // Specify output location of the local- and remote list of unmutable files defined by the sponsor
    var sponsorUnmutableFilelistFilepath =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/" +
      sponsorUnmutableFilelistFilename;
    var commandToGetUnmutableFilelist =
      "curl \x22https://raw.githubusercontent.com/" +
      githubUsernameSponsor +
      "/" +
      repoNameSponsor +
      "/" +
      commitSponsor +
      "/" +
      sponsorUnmutableFilelistFilename +
      "\x22 > " +
      sponsorUnmutableFilelistFilepath;

    // Specify the output paths for the unter and sponsor files
    var hunterFilecontentPath =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/hunter_temp_filecontent.txt";
    var sponsorFilecontentPath =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/sponsor_temp_filecontent.txt";

    // -----------------------------------------Specify Curl Commands That Get API Data---------------------------
    // create command that curls the hunter files (based on the filename that is inside the shell variable $line)
    var culHunterFiles =
      "curl \x22https://raw.githubusercontent.com/" +
      githubUsernameHunter +
      "/" +
      repoNameHunter +
      "/" +
      commitHunter +
      "/$line\x22";

    // create command that curls the sponsor files (based on the filename that is inside the shell variable $line)
    var curlSponsorFiles =
      "curl \x22https://raw.githubusercontent.com/" +
      githubUsernameSponsor +
      "/" +
      repoNameSponsor +
      "/" +
      commitSponsor +
      "/$line\x22";

    // combine the commands that curl a file from the hunter and bounter repository commits respectively, and export the difference
    // in their file content
    var commandPerLine =
      culHunterFiles +
      " > " +
      hunterFilecontentPath +
      " && " +
      curlSponsorFiles +
      " > " +
      sponsorFilecontentPath +
      " && diff " +
      hunterFilecontentPath +
      " " +
      sponsorFilecontentPath +
      " >> " +
      differencesFilename;

    // Print the final command that outputs the differences
    console.log(
      "The shell command that curls the bounty hunter file and sponsor file for each specified unmutable file is="
    );
    console.log(commandPerLine);
    console.log("");

    // Substitute the difference checking command into a command that loops through file list marked unmutable by the sponsor
    var command =
      "while read line; do " +
      commandPerLine +
      "; done < " +
      sponsorUnmutableFilelistFilepath;
    console.log(
      "The differences of each unmutable file is appended to a single differences file with the following shell command:"
    );
    console.log(command);
    console.log("");

    // -----------------------------------------Get The Tellor Oracles Data With Shell --------------------------
    // get unmutable file list from sponsor repo
    helper
      .execCommand(commandToGetUnmutableFilelist)
      .then((res) => {
        console.log(
          "Getting list of unmutable files from the sponsor repository, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "An error occured whilst getting list of unmutable files from the sponsor repository:",
          err
        );
      });

    // wait till file is read (it takes a while)
    // TODO: do not hardcode the build time, but make it dependend on completion of the execCommand function.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // compare differences in file content
    helper
      .execCommand(command)
      .then((res) => {
        console.log(
          "Checking if the bounty hunter changed a file marked 'unmutable' by the sponsor, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "An error occured whilst checking if the bounty hunter changed a file marked 'unmutable' by the sponsor:",
          err
        );
      });

    // wait till file is read (it takes a while)
    // TODO: do not hardcode the build time, but make it dependend on completion of the execCommand function.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // read out the pass/fail status of the repository build from file
    var differenceInFilelist = fs.readFileSync(differencesFilename);
    var stringDifferenceInFilelist = differenceInFilelist.toString();
    console.log(
      "The list of different files in unmutable files should be not void/empty, because this tests an attack of the bounty hunter on the unit test. The detected difference is:"
    );
    console.log(stringDifferenceInFilelist);
    console.log("");

    // encode build checkflag
    const encodedDifferenceInFilelist = helper.encode(
      stringDifferenceInFilelist + "offset"
    );
    console.log(
      "The numerically encoded list of different files between sponsor repo and bounty hunter repo is (including an offset):"
    );
    console.log(encodedDifferenceInFilelist);
    console.log("");

    // specify the mock value that is fed by the Tellor oracles into the contract:
    const mockValue = encodedDifferenceInFilelist;

    // -----------------------------------------Verify the contract returns the correct retrieved value ----------------------------
    await tellorOracle.submitValue(requestId, mockValue);
    let retrievedVal = await compareFileContents.readTellorValue(requestId);
    assert.equal(retrievedVal.toString(), expectedSponsorContractOutput);
  });
});
