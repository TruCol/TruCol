// This contract simulates paying out if a Tellor oracle says:
// "the github branch of the hunter repository did not tamper with 
// unmutable files", by returning an integer.
pragma solidity >=0.5.16;
import "usingtellor/contracts/UsingTellor.sol";
import "usingtellor/contracts/TellorPlayground.sol";

contract CompareFileContents is UsingTellor {
    constructor(address payable _tellorAddress)
        public
        UsingTellor(_tellorAddress)
    {}

    function readTellorValue(uint256 _tellorID)
        external
        view
        returns (uint256)
    {
        //Helper function to get latest available value for that Id
        (bool ifRetrieve, uint256 value, uint256 _timestampRetrieved) =
            getCurrentValue(_tellorID);
        if (!ifRetrieve) return 33;
		
		
		// numerical js encoding of "zero difference in file lists+some offset to not get an incoming None value"
		 // computed manually with encode function from test_unmoidified_file_list.js
		 uint256 untampered_file_list = 122485596185972;
		 
		 // Check if build passed or not (based on hardcoded encoding of string build:passed
		if (value == untampered_file_list) 
			return 2; // The file list in the repo of the bounty hunter is not tampered with
        return 1; // The file list/code skeleton provided by the sponsor is modified
    }

    function readTellorValueBefore(uint256 _tellorId, uint256 _timestamp)
        external
        returns (uint256, uint256)
    {
        //Helper Function to get a value before the given timestamp
        (bool _ifRetrieve, uint256 _value, uint256 _timestampRetrieved) =
            getDataBefore(_tellorId, _timestamp);
        if (!_ifRetrieve) return (0, 0);
        return (_value, _timestampRetrieved);
    }
}
