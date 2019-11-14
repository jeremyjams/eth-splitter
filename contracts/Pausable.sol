pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";

contract Pausable is Ownable {

    bool private isOn;

    event PauseStateChangeEvent(bool isOn);

    constructor() public {
        isOn = true;
    }

    modifier onlyOn {
        require(isOn, "Should be ON");
        _;
    }

    modifier onlyOff {
        require(!isOn, "Should be OFF");
        _;
    }

    function enable() public onlyOwner onlyOff {
        toggleStateAndEmit();
    }

    function disable() public onlyOwner onlyOn {
        toggleStateAndEmit();
    }

    function toggleStateAndEmit() private {
        isOn = !isOn;

        emit PauseStateChangeEvent(isOn);
    }

}
