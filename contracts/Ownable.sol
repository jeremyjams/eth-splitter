pragma solidity >=0.4.21 <0.6.0;

contract Ownable {

  address public owner;

  constructor() public {
    owner = msg.sender;//isnt required, just for information
  }

  modifier onlyOwner {
    require(owner == msg.sender, "Owner only");
    _;
  }

  function changeOwner(address newOwner) public onlyOwner returns (bool sucess) {
    require(newOwner != address(0));
    require(newOwner != owner, "Owner should be new");

    owner = newOwner;

    return true;
  }

}
