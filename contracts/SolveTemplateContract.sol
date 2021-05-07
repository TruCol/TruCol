// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

// Example contract of a TestContract.
contract SolveContract {

    TemplateTestContract testContract;  // Create variable for the testContract which needs to be solved.
    address payable owner;              // Create variable for the owner which solves the test contract.

    // Constructor to initialise the contract variables.
    constructor(address testAddress) public payable {              
        testContract = TemplateTestContract(testAddress);   // Initialise the testContract variable.
        owner = msg.sender;                                 // Initialise the owner of the contract to be the creator of the contract.
    }
    
    // Function to solve the testContract.
    function solve() public payable{
        testContract.test(owner);
    }

    // Template of the main function which solves the testContract.
    // Note that the amount and types of input and output variables need to be consistent with the testContract.
    function main(TypeInputVariable InputVariable1) pure public returns(TypeOutputVariable OutputVariable) {
        // CODE NEEDED WHICH SOLVES THE TEST CONTRACT
    }
}

// TemplateTestContract so the SolveContract knows the structure of the testContract.
contract TemplateTestContract {
    function test(address payable hunter) public;
}
