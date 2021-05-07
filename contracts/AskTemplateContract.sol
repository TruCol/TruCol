// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

// Example contract of a TestContract.
contract AskContract {

    bool solved;    // Boolean to denote if contract is solved.
    address payable owner;  // Owner of the contract, first this is the sponser.
    uint expiry;        // Get the time when the contract expires.

    constructor() public payable {      // Constructor to initialise values.
        solved = false;         //  Boolean value to indicate if contract is already solved.
        owner = msg.sender;     //  Set the owner of the contract to the creator of the contract.
        expiry = 1612569800;    //  Unix timestamp of the moment of expiry. 
    }

    function test(address payable hunter) public payable {
        TemplateSolveContract solver = TemplateSolveContract(msg.sender); // The message sender is the contract activating the test function.

        // Change the TYPE and VALUE fields to the correct ones.
        TYPE x = VALUE; // INPUT OF THE TEST
        TYPE y = VALUE; // OUTPUT OF THE TEST

        require(y == solver.main(x), "Wrong output");   // Require the output of the main function to be y.
        solved = true;                                  // Set solved to true.
        owner = hunter;                                 // Set the ownership to the hunter.
        owner.transfer(address(this).balance);          // Transfer the bounty to the hunter.
    }

    // Getter function for the solved variable.
    function getSolved() public view returns (bool){   
        return solved;
    }
    
    // Getter function for the Ownership.
    function getOwner() public view returns (address) { 
        return owner;
    }
    
    // Getter function for the balance of the contract.
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
    
    // Refund method to claim the value of the contract after expiry.
    function refund() public {
        require(msg.sender == owner && block.timestamp >= expiry, "Contract is not expired yet");   // The sender must own the contract and the contract must be expired.
        selfdestruct(owner);    // Let the contract selfdestruct and move the value to the owner.
    }
}

// TemplateSolveContract so the TestContract knows the structure of the SolveContract.
contract TemplateSolveContract {
	function main(uint x) public returns (uint);
}
