const Splitter = artifacts.require("./Splitter.sol");
Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

// ganache-cli --accounts=10 --host=0.0.0.0

//TODO  Use https://www.npmjs.com/package/truffle-assertions

contract("Splitter", function() {
    describe("Testting Splitter contract", function() {

      let instance;
      let owner;
      let alice;
      let bob;
      let carol;
      let anyone;

      beforeEach("Fresh contract & accounts", function() {
        return Splitter.new()
            .then(_instance => {
                instance = _instance;
                return instance.getOwner();
            })
            .then(_owner => {
              owner = _owner;
              console.log(owner + ": owner address");
              return web3.eth.getAccountsPromise();
            })
            .then(accounts => {
              alice = accounts[1];
              bob = accounts[2];
              carol = accounts[3];
              anyone = accounts[9];

              console.log(alice + ": alice address");
              console.log(bob + ": bob address");
              console.log(carol + ": carol address");

              return true;
            })
            .then(success => web3.eth.getBalancePromise(alice))
            .then(weiBalance => web3.utils.fromWei(weiBalance))
            .then(balance => {
              console.log(balance + " ETH: alice balance");
              return assert.isTrue(balance.toString(10) > "10", "Alice is broke");
            })
            .then(success => web3.eth.getBalancePromise(bob))
            .then(weiBalance => web3.utils.fromWei(weiBalance))
            .then(balance => {
              console.log(balance + " ETH: bob balance");
              return assert.isTrue(balance.toString(10) > "10", "Bob is broke");
            })
            .then(success => web3.eth.getBalancePromise(carol))
            .then(weiBalance => web3.utils.fromWei(weiBalance))
            .then(balance => {
              console.log(balance + " ETH: carol balance");
              return assert.isTrue(balance.toString(10) > "10", "Carol is broke");
            })
            .then(success => instance.balances.call(alice, {from: anyone}))
            .then(balance => {
              assert.equal(balance, 0, "Alice initial Splitter balance should be 0")
              return instance.balances(bob, {from: anyone})
            })
            .then(balance => {
              assert.equal(balance, 0, "Bob initial Splitter balance should be 0")
              return instance.balances(carol, {from: anyone})
            })
            .then(balance => {
              assert.equal(balance, 0, "Carol initial Splitter balance should be 0")
            })
      });

      it("depositForSplitDonation (even donation)", function() {
        return instance.splitDonation(bob, carol, {from: alice, value: 4})
          .then(txObj => {
            assert.equal(txObj.logs[0].event, "SplitDonationEvent", "splitDonation(..) failed")
            return instance.balances(alice, {from: anyone})
          })
          .then(balance => {
            assert.equal(balance, 0, "Alice final Splitter balance should be 0")
            return instance.balances(carol, {from: anyone})
          })
          .then(balance => {
            assert.equal(balance, 2, "Bob final Splitter balance should be 2")
            return instance.balances(carol, {from: anyone})
          })
          .then(balance => {
            assert.equal(balance, 2, "Carol final Splitter balance should be 2")
          })
      });

      it("depositForSplitDonation (odd donation)", function() {
        return instance.splitDonation(bob, carol, {from: alice, value: 5})
          .then(txObj => {
            assert.equal(txObj.logs[0].event, "SplitDonationEvent", "splitDonation(..) failed")
            return instance.balances(alice, {from: anyone})
          })
          .then(balance => {
            assert.equal(balance, 1, "Alice final Splitter balance should be 1")
            return instance.balances(carol, {from: anyone})
          })
          .then(balance => {
            assert.equal(balance, 2, "Bob final Splitter balance should be 2")
            return instance.balances(carol, {from: anyone})
          })
          .then(balance => {
            assert.equal(balance, 2, "Carol final Splitter balance should be 2")
          })
      });

      //TODO add bad depositForSplitDonation tests




      //TODO do the same for withdraw

  });
});
