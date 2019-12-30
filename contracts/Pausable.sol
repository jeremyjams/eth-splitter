pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";

contract Pausable is Ownable {

    bool paused;
    bool killed;//false by default

    event PausedEvent(address indexed pauser);
    event ResumedEvent(address indexed resumer);
    event KilledEvent(address indexed killer);
    event PurgedEvent(address indexed purger, uint256 purgedAmount);

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

    modifier whenKilled  {
        require(killed, "Should be killed");
        _;
    }

    function resume() public onlyOwner whenPaused {
        paused = false;
        emit ResumedEvent(msg.sender);
    }

    function pause() public onlyOwner whenRunning {
        paused = true;
        emit PausedEvent(msg.sender);
    }

    function kill() public onlyOwner whenPaused {
        killed = true;

        emit KilledEvent(msg.sender);
    }

    function purge() public onlyOwner whenKilled returns (bool success) {
        require(address(this).balance > 0, "Empty balance");

        emit PurgedEvent(msg.sender, address(this).balance);
        (success,) = msg.sender.call.value(address(this).balance)("");
        require(success, "Transfer failed.");
    }

}
