pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";
import "./Pausable.sol";
import "./SafeMath.sol";
//import "@openzeppelin/contracts/math/SafeMath.sol";

contract Splitter is Pausable {

    using SafeMath for uint;
    mapping(address => uint) public balances;

    event SplitDonationEvent(address indexed giver, uint donation, address beneficiaryA, address beneficiaryB);
    event WithdrawEvent(address indexed withdrawer, uint amount);

    constructor(bool paused) Pausable(paused) public {}

    function splitDonation(address beneficiaryA, address beneficiaryB) public whenRunning payable returns (bool success) {
        require(beneficiaryA != address(0));
        require(beneficiaryB != address(0));
        require(msg.value > 0);

        //Probably should remove this block to save gas since we're just talking about 1wei
        uint remainder = msg.value.mod(2);
        if (remainder != 0) {
            //sender receives remainder (1 wei for 2 players) back in his Splitter balance
            balances[msg.sender] = balances[msg.sender].add(remainder);
        }

        uint halfDonation = msg.value.div(2);

        balances[beneficiaryA] = balances[beneficiaryA].add(halfDonation);
        balances[beneficiaryB] = balances[beneficiaryB].add(halfDonation);
        emit SplitDonationEvent(msg.sender, msg.value, beneficiaryA, beneficiaryB);

        return true;
    }

    function withdraw() public whenRunning returns (bool success) {
        uint withdrawal = balances[msg.sender];
        require(withdrawal > 0);

        balances[msg.sender] = 0;
        emit WithdrawEvent(msg.sender, withdrawal);
        (success,) = msg.sender.call.value(withdrawal)("");
        require(success, "Transfer failed.");
    }

}
