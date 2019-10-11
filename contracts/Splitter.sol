pragma solidity >=0.4.21 <0.6.0;

contract Splitter {

  address public owner;
  mapping (address => uint) private balances;
  event DepositForSplitDonationEvent(address donator, uint donation, address beneficiaryA, address beneficiaryB);
  event TopUpBalanceEvent(address beneficiary, uint amount, address donator);
  event WithdrawBalanceEvent(address withdrawer, uint amount);

  constructor() public {
    owner = msg.sender;
  }

  function viewBalance() public view returns (uint balance) {
    return balances[msg.sender];
  }

  function viewBalance(address account) public view returns (uint balance) {
    return balances[account];
  }

  function depositForSplitDonation(address beneficiaryA, address beneficiaryB)
  public payable returns (bool success) {
    address payable donator = msg.sender;
    uint donation = msg.value;

    require(donation > 0);
    require(beneficiaryA != address(0));
    require(beneficiaryB != address(0));

    emit DepositForSplitDonationEvent(donator, donation, beneficiaryA, beneficiaryB);

    if(donation % 2 != 0){//odd amount
      donation = donation--;//lets make the donation even
      balances[donator]++; //sender receives 1 wei back in his balance
      emit TopUpBalanceEvent(donator, 1, donator);
    }

    uint halfDonation = donation / 2;

    balances[beneficiaryA] += halfDonation;
    balances[beneficiaryB] += halfDonation;

    emit TopUpBalanceEvent(beneficiaryA, halfDonation, donator);
    emit TopUpBalanceEvent(beneficiaryB, halfDonation, donator);

    return true;
  }

  function withdraw() public returns (bool success) {
    address payable withdrawer = msg.sender;

    require(balances[withdrawer] > 0);

    uint withdrawal = balances[withdrawer];
    balances[withdrawer] = 0;

    emit WithdrawBalanceEvent(withdrawer, withdrawal);

    withdrawer.transfer(withdrawal);

    return true;
  }

}
