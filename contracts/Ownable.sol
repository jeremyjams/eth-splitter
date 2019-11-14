pragma solidity >=0.4.21 <0.6.0;

contract Ownable {

    address private owner;

    event OwnershipTransferredEvent(address indexed oldOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(owner == msg.sender, "Owner only");
        _;
    }

    function changeOwner(address newOwner) public onlyOwner returns (bool success) {
        require(newOwner != address(0));
        require(newOwner != owner, "Owner should be new");

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferredEvent(oldOwner, owner);

        return true;
    }

    function getOwner() public pure returns (address owner){
        return owner;
    }

}
