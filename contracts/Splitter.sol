pragma solidity >=0.4.21 <0.6.0;

import "./Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Pausable.sol";

contract Splitter is Pausable {

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
            balances[msg.sender] = SafeMath.add(balances[msg.sender], 1);
        }

        uint halfDonation = SafeMath.div(msg.value, 2);

        balances[beneficiaryA] = SafeMath.add(balances[beneficiaryA], halfDonation);
        balances[beneficiaryB] = SafeMath.add(balances[beneficiaryB], halfDonation);
        emit SplitDonationEvent(msg.sender, msg.value, beneficiaryA, beneficiaryB);

        return true;
    }

    function withdraw() public whenRunning returns (bool success) {
        require(balances[msg.sender] > 0);

        uint withdrawal = balances[msg.sender];
        balances[msg.sender] = 0;
        emit WithdrawEvent(msg.sender, withdrawal);
        (bool _success,) = msg.sender.call.value(withdrawal)("");
        require(_success, "Transfer failed.");

        return true;
    }

}
