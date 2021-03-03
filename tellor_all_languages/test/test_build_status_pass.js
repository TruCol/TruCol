const BuildStatusCheck = artifacts.require("./BuildStatusCheck.sol");
const exec = require("child_process").exec;
const Tellor = artifacts.require("TellorPlayground.sol");
var fs = require("fs");
var helper = require("./helper");
var rimraf = require("rimraf"); //npm install rimraf

//Helper function that submits and value and returns a timestamp for easy retrieval
const submitTellorValue = async (tellorOracle, requestId, amount) => {
  //Get the amount of values for that timestamp
  let count = await tellorOracle.getNewValueCountbyRequestId();
  await tellorOracle.submitValue(requestId, amount);
  let time = await getTimestampbyRequestIDandIndex(requestId, count.toString());
  return time.toNumber();
};

contract("UsingTellor Tests", function (accounts) {
  let buildStatusCheck;
  let tellorOracle;

  beforeEach("Setup contract for each test", async function () {
    tellorOracle = await Tellor.new();
    buildStatusCheck = await BuildStatusCheck.new(tellorOracle.address);
  });

  it("Update Price", async function () {
    // Specify which data (type) is requested from the oracle. (Should become something like 59, a new entry for TruCol)
    const requestId = 1;

    // -----------------------------------------Specify Tellor Oracles Data Sources ----------------------------
    // Read whether a travis build has failed or passed
    const githubUsernameHunter = "v-bosch";
    const repoNameHunter = "sponsor_example";
    const commitHunter = "b822b1cd82ea169bbc1a7faf3d7855eae6538130";

    // -----------------------------------------Specify Temporary input and output (files)------------------------
    // Show the contract contains the logic to identify a correct build fail/pass.
    // If the build passes, a uint256 of value 2 is expected
    // from the contract. Otherwise a uint of value 1 is expected.
    const expectedSponsorContractOutput = 2;

    // Specify local output location of curled data
    var testOutputFolder = "curled_test_data";
    var testType = "build_status";
    var testCase = "passed";
    var outputFilename =
      testOutputFolder +
      "/" +
      testType +
      "/" +
      testCase +
      "/" +
      testType +
      "_" +
      testCase +
      ".json";

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

    // -----------------------------------------Get The Tellor Oracles Data With Shell --------------------------
    var getBuildStatusCommand =
      "GET https://api.github.com/repos/" +
      githubUsernameHunter +
      "/" +
      repoNameHunter +
      "/commits/" +
      commitHunter +
      "/check-runs > " +
      outputFilename;

    console.log("The shell command that gets the build successfull status is:");
    console.log(getBuildStatusCommand);
    console.log("");

    // Run the shell command that stores the Travis build status into a file
    helper
      .execCommand(getBuildStatusCommand)
      .then((res) => {
        console.log(
          "Exporting output of travis api call to output file, please wait 10 seconds.",
          res
        );
      })
      .catch((err) => {
        console.log(
          "An error occured whilst exporting output of travis api call to output file:",
          err
        );
      });

    // Manually wait a bit unitll the Travis build status is stored into file before proceding.
    // TODO: do not hardcode the build time, but make it dependend on completion of the execCommand function.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // -----------------------------------------Process The Tellor Oracles Data With Shell ------------------------
    // Read out the Travis build status that is outputed to a file, from the file.
    var obj = JSON.parse(fs.readFileSync(outputFilename, "utf8"));
    var curledBuildStatus = obj["check_runs"][0]["output"]["title"].toString();

    // print the build status that is read
    console.log("The build status of the bounty hunter repository is:");
    console.log(curledBuildStatus);
    console.log("");

    // encode build status as a number such that it can be passed to the contract
    // TODO: convert to boolean to save gas costs
    const encodedBuildStatus = helper.encode(curledBuildStatus);
    console.log("encodedBuildStatus");
    console.log(encodedBuildStatus);
    console.log("");

    // -----------------------------------------Verify the contract returns the correct retrieved value ----------------------------
    // specify the mock value that is into the contract fed by the Tellor oracles:
    const mockValue = encodedBuildStatus;

    // Simulate the Tellor oracle and test the contract on oracle output.
    await tellorOracle.submitValue(requestId, mockValue);
    let retrievedVal = await buildStatusCheck.readTellorValue(requestId);
    assert.equal(retrievedVal.toString(), expectedSponsorContractOutput);
  });
});
