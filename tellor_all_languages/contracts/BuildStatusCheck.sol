// This contract simulates paying out if a Tellor oracle says:
// "the github build of the hunter repository passed", by returning an integer.
pragma solidity >=0.5.16;
import "usingtellor/contracts/UsingTellor.sol";
import "usingtellor/contracts/TellorPlayground.sol";

contract BuildStatusCheck is UsingTellor {
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
        if (!ifRetrieve) return value;
		
		
		// numerical js encoding of "build:passed" to be done by oracles when calling html content
		 // computed manually with encode function from test_passed_build.js
		 uint256 build_passed = 20567952817047602405181711716;
		 uint256 build_failed = 20567952817047591409897203044;		 
		 
		 // Check if build passed or not (based on hardcoded encoding of string build:passed
		if (value == build_passed)
			return 2;
		if (value == build_failed)
			return 1;
        return value; // error thrown during build status query
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
