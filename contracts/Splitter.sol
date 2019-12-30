pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Pausable.sol";

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

        //Probably should remove this block to save gas since we just talking about 1wei
        if (SafeMath.mod(msg.value, 2) != 0) {//odd amount
            //sender receives 1 wei back in his Splitter balance
            balances[msg.sender] = balances[msg.sender].add(1);
        }

        uint halfDonation = SafeMath.div(msg.value, 2);

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
