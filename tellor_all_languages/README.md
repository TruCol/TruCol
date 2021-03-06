# Trucol Adaptation of Teller Sample Project

This is a modification of the Tellor Sample Project repository that: checks if a GitHub commit of the solution of the bounty hunter:

0. passes the Travis CI build based on the sponsor tests.
1. did not add any (attack) files w.r.t. the code skeleton provided by the sponsor.
2. did not tamper any files marked as _unmutable_ by the sponsor.

F.Y.I. The original readme of the unmodified source repository of the code in this folder is [here](https://github.com/tellor-io/sampleUsingTellor) and [this](https://docs.tellor.io/tellor/) is the documentation.

## TruCol Installation Instructions

0. Open Terminal, go to the root of the TruCol directory.
1. Browse into this directory:

```
cd tellor_all_languages
```

2. Install npm on device

```
sudo apt install npm
```

3. Install the requirements for sampleUsingTellor:

```
npm install
```

4. You can run tests on the tellor contract on some network using:

```
npm test
```

## Test Descriptions

Below are the instructions for the 6 tests that check if the bounty hunter did not cheat. The TODO's are proposed to be evaluated after feedback by Tellor.

### Test Travis CI Build status - failed

*.*Test Filename:** `test_build_status_fail.js`
**Contract Filename:** `BuildStatusCheck.sol`
**Description:\*\* This test verifies that the test/oracle correctly detects that the build in Travis CI has failed. Additionally it verifies that the uint256 that comes from the test/oracle and goes into the contract is correctly identified as a failed build. This is done by hardcoding the uint256 value that corresponds to "failed build" in the test/oracle into the smart contract and returning value 1 if it passes.

- [ ] **TODO:** Convert the test into an actual oracle that can be deployed.
- [ ] **TODO:** Currently the test/oracle passes a uint256 to the smart contract, whereas a boolean is sufficient, therefore, the transaction costs could perhaps be lowered by letting the oracle emit a boolean instead of uint256.
- [ ] **TODO:** Currently the smart contract returns a uint256 that represents whether the contract will pay out or not. This should be changed into doing an actual transaction and testing if the bounty was transferred correctly.
- [ ] **TODO:** Currently the data from the Travis Build status is curled using shell (not bash) commands within NodeJS. We could look up how the oracles are actually implemented and find minimum computational costs for a sufficiently safe protocol/query. In practice, determine which language the Tellor oracles use and write a proper implementation.
- **Hunter github name:** `v-bosch`
- **Hunter repository:** `sponsor_example`
- **Hunter repository branch:** `failing_build`
- **Hunter repository commit:** `c4c8490017a2b859e973c0be6bab3dbe8bccbc2c`

### Test Travis CI Build status - passed

**Test Filename:** `test_build_status_pass.js`
**Contract Filename:** `BuildStatusCheck.sol`
**Description:** This test verifies that the test/oracle correctly detects that the build in Travis CI has passed. Additionally it verifies that the uint256 that comes from the test/oracle and goes into the contract is correctly identified as a passed build. This is done by hardcoding the uint256 value that corresponds to "passed build" in the test/oracle into the smart contract and returning value 1 if it passes.

- [ ] **TODO:** See _Test Travis CI Build status - failed_ TODO's 0 to 5.
- **Hunter github name:** `v-bosch`
- **Hunter repository:** `sponsor_example`
- **Hunter repository branch:** `passing_build`
- **Hunter repository commit:** `b822b1cd82ea169bbc1a7faf3d7855eae6538130`

### Test If Bounty Hunter Added New (Attack) Files To Sponsor Code Skeleton

**Test Filename:** `test_mod_file_list.js`
**Contract Filename:** `CompareFileListsInRepo.sol`
**Description:** This test verifies that that an certain attack of bounty hunter is identified corretly by the test/oracles. It catches a bounty hunter attack where the hunter adds an additional file that could potentially hijack the Travis CI to give off a falsified CI Build status. This is done by curling the list of files in the latest commit of the sponsor repository and bounty hunter repository. The curling is done using shell (not bash) scripts in the node.js test/oracle file. Next, the test/oracle files computes the difference between the two file lists using shell (not bash) commands in node.js and converts the difference into a uint256 while adding an offset. This uint256 is passed to the solidity contract, where basically the uint256 of the offset (so with zero difference in file lists) is hardcoded. If the incoming uint256 matches the hardcoded offset uint256 value, the smart contract pays out, otherwise it doesnt. (The payout is simulated by returning a uint256 value 2, no payout is represented by returning a uint256 value of 1.)

- [ ] **TODO:** Do an actual payout and test the resulting balances instead of checking the return value of 2 and 1.
- **Hunter github name:** `a-t-0`
- **Hunter repository:** `sponsor_example`
- **Hunter repository branch:** `attack_in_new_file`
- **Hunter repository commit:** `00c16a620847faae3a6b7b1dcc5d4d458f2c7986`
- **Sponsor github name:** `a-t-0`
- **Sponsor repository:** `sponsor_example`
- **Sponsor repository branch:** `main`
- **Sponsor repository commit:** `556c43c2441356971da6b55176a069e9b9497033`

### Test Bounty Hunter Did Not Add New (Attack) Files To Sponsor Code Skeleton

**Test Filename:** `test_unmod_file_list.js`
**Contract Filename:** `CompareFileListsInRepo.sol`
**Description:** This test verifies that the test/oracle sends a "payout" signal if the bounty hunter did not add any files to the code skeleton provided by the bounty hunter

- [ ] **TODO:** See _Test If Bounty Hunter Added New (Attack) Files To Sponsor Code Skeleton_ TODO's 0.
- **Hunter github name:** `a-t-0`
- **Hunter repository:** `sponsor_example`
- **Hunter repository branch:** `no_attack_in_new_file`
- **Hunter repository commit:** `d8e518b97cc1a528f49a01081890931403361561`
- **Sponsor github name:** `a-t-0`
- **Sponsor repository:** `sponsor_example`
- **Sponsor repository branch:** `main`
- **Sponsor repository commit:** `556c43c2441356971da6b55176a069e9b9497033`

### Test If Bounty Hunter Manipulation Of A Test File Is Detected

**Test Filename:** `test_file_contents_changed.js`
**Contract Filename:** `CompareFileContents.sol`
**Description:** This test verifies that the bounty hunter did not falsify the unittests. This is done by looping through the file list and curling each file locally from both the bounty hunter repository and sponsor repository and then comparing whether the contents of the files are identical. If it is identical, no difference is detected, an offset is added and the difference+offset is encoded to a uint256 which is passed to the solidity contract, which pays out if the hardcoded uint256 representing the encoded offset matches that of the incoming uint256.

- **Hunter github name:** `a-t-0`
- **Hunter repository:** `sponsor_example`
- **Hunter repository branch:** `attack_unit_test`
- **Hunter repository commit:** `2bd88d1551a835b12c31d8a392f2ee0bf0977c65`
- **Sponsor github name:** `a-t-0`
- **Sponsor repository:** `sponsor_example`
- **Sponsor repository branch:** `main`
- **Sponsor repository commit:** `556c43c2441356971da6b55176a069e9b9497033`
- **Sponsor unmutable file list:** `unmutable_filelist.txt`

### Test If Unmanipulated Test Files Result In Payout Signal

**Test Filename:** `test_file_contents_unchanged.js`
**Contract Filename:** `CompareFileContents.sol`
**Description:** This test verifies that the test/oracle sends a payout signal if the bounty hunter does not falsify the unit tests.

0. **TODO:** See _Test If Bounty Hunter Manipulation Of A Test File Is Detected_.

- **Hunter github name:** `a-t-0`
- **Hunter repository:** `sponsor_example`
- **Hunter repository branch:** `no_attack_in_filecontent`
- **Hunter repository commit:** `4d78ba9b04d26cfb95296c0cee0a7cc6a3897d44`
- **Sponsor github name:** `a-t-0`
- **Sponsor repository:** `sponsor_example`
- **Sponsor repository branch:** `main`
- **Sponsor repository commit:** `556c43c2441356971da6b55176a069e9b9497033`

## Future development

A brief recap of the TODOs that are to be completed before the Tellor oracle system can be used live by the TruCol protocol:

- [ ] Merge the tests of the oracles into a single oracle test script.
- [ ] Ask if/how the provided NodeJS implementation of doing the github queries can be optimised for safety and computational cost minimisation for the actual Tellor oracles.
- [ ] Ask for a custom Tellor ID that allows passing the branch and/or commit (or reading it from the contract).

## Attack Surfaces

This describes the known possible attacks in the Tellor oracle system, Github API- and Travis API calls that are used that need to be tested against.

### Tellor Oracles

0. If the bounty is lower than the cost of attacking the Tellor oracle network the bounty hunter could attack the Tellor oracle network to get the bounty. That is why it is recommended by Tellor to always display the cost of attacking the Tellor oracle network.

### Travis API

0. Travis-CI could be hacked to yield false positives.

### Github API

0. Source: https://docs.github.com/en/rest/reference/repos#contents
   _The GitHub API has an upper limit of 1,000 files for a directory. If you need to retrieve more files, use the Git Trees API._
   This implies that the 1001th file is not checked by the Tellor Oracles if they use the GitHub API, this means that the Sponsor should get a warning if the skeleton contains 1000 files or more. Because if that is the case, the bounty hunter could hide an attack file in the 1001th+ file.
1. Source: https://docs.github.com/en/rest/reference/repos#contents
   _The GitHub API supports files up to 1 megabyte in size._
   This implies the Tellor Oracles should check if there exists a file larger than 1 megabyte in size in the repository of the bounty hunter. If such a file is detected, the tellor should not send the payout signal. This is because the bounty hunter could then hide an attack file in the 1mb+ sized file. Additionally the sponsor should not be allowed to publish files larger than 1 mb in its repo. It would be cheaper to first check if the total repo size is below 1 MB, and only if that is not the case, let the API check all the file sizes separately.
2. See Travis API point 0. The GitHub (and Travis) API calls should allways be based on an explicit commit.
