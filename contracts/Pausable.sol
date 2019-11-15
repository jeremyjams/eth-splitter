pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";

contract Pausable is Ownable {

    bool private paused;
    bool private killed;

    event PausedEvent();
    event ResumedEvent();
    event KilledEvent();

    constructor(bool _paused) public {
        paused = _paused;
    }

    modifier whenRunning  {
        require(!killed, "Should be alive");
        require(!paused, "Should be running");
        _;
    }

    modifier whenPaused {
        require(!killed, "Should be alive");
        require(paused, "Should be paused");
        _;
    }

    function resume() public onlyOwner whenPaused {
        paused = false;
        emit ResumedEvent();
    }

    function pause() public onlyOwner whenRunning {
        paused = true;
        emit PausedEvent();
    }

    function kill() public onlyOwner {
        killed = true;

        emit KilledEvent();

        (bool success,) = msg.sender.call.value(address(this).balance)("");
        require(success, "Transfer failed.");

    }

}
