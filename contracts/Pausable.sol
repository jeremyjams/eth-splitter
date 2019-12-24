pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";

contract Pausable is Ownable {

    bool private paused;
    bool private killed;

    event PausedEvent();
    event ResumedEvent();
    event KilledEvent();
    event WithdrawAfterKilledEvent(uint256);

    constructor(bool _paused) public {
        paused = _paused;
        killed = false;
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
        emit ResumedEvent();
    }

    function pause() public onlyOwner whenRunning {
        paused = true;
        emit PausedEvent();
    }

    function kill() public onlyOwner whenPaused {
        killed = true;

        emit KilledEvent();
    }

    function withdrawAfterKill() public onlyOwner whenKilled returns (bool success) {
        require(address(this).balance > 0, "Empty balance");

        emit WithdrawAfterKilledEvent(address(this).balance);
        (bool _success,) = msg.sender.call.value(address(this).balance)("");
        require(_success, "Transfer failed.");

        return true;
    }

}
