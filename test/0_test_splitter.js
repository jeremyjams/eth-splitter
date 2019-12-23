const Splitter = artifacts.require("./Splitter.sol");
const Promise = require("bluebird");
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

// ganache-cli --accounts=10 --host=0.0.0.0

contract("Splitter", function() {
    describe("Testting Splitter contract", function() {

        let splitter;
        let alice;
        let bob;
        let carol;
        let anyone;

        beforeEach("Fresh contract & accounts", async function() {
            splitter = await Splitter.new(false)

            let accounts = await web3.eth.getAccountsPromise();
            alice = accounts[1];
            bob = accounts[2];
            carol = accounts[3];
            anyone = accounts[9];

            let aliceWeiBalance = await web3.eth.getBalancePromise(alice)
            let aliceBalance = await web3.utils.fromWei(aliceWeiBalance)
            assert.isTrue(aliceBalance.toString(10) > "10", "Alice is broke");

            let bobWeiBalance = await web3.eth.getBalancePromise(bob)
            let bobBalance = await web3.utils.fromWei(bobWeiBalance)
            assert.isTrue(bobBalance.toString(10) > "10", "Bob is broke");

            let carolWeiBalance = await web3.eth.getBalancePromise(carol)
            let carolBalance = await web3.utils.fromWei(carolWeiBalance)
            assert.isTrue(carolBalance.toString(10) > "10", "Carol is broke");

            let aliceSplitterBalance = await splitter.balances.call(alice, {from: anyone})
            assert.equal(aliceSplitterBalance, 0, "Alice initial Splitter balance should be 0")

            let bobSplitterBalance = await splitter.balances.call(bob, {from: anyone})
            assert.equal(bobSplitterBalance, 0, "Bob initial Splitter balance should be 0")

            let carolSplitterBalance = await splitter.balances.call(carol, {from: anyone})
            assert.equal(carolSplitterBalance, 0, "Carol initial Splitter balance should be 0")
        });

        /*
        * Split
        */
        it("splitDonation (even donation)", async function() {
            let txObj = await  splitter.splitDonation(bob, carol, {from: alice, value: 4})
            //truffleAssert.prettyPrintEmittedEvents(txObj);
            truffleAssert.eventEmitted(txObj, 'SplitDonationEvent');//could check content here

            let aliceBalance = await splitter.balances(alice, {from: anyone})
            assert.equal(aliceBalance, 0, "Alice final Splitter balance should be 0")

            let bobBalance = await splitter.balances(bob, {from: anyone})
            assert.equal(bobBalance, 2, "Bob final Splitter balance should be 2")

            let carolBalance = await splitter.balances(carol, {from: anyone})
            assert.equal(carolBalance, 2, "Carol final Splitter balance should be 2")
        });

        it("splitDonation (odd donation)", async function() {
            let txObj = await  splitter.splitDonation(bob, carol, {from: alice, value: 5})
            truffleAssert.eventEmitted(txObj, 'SplitDonationEvent');//could check content here

            let aliceBalance = await splitter.balances(alice, {from: anyone})
            assert.equal(aliceBalance, 1, "Alice final Splitter balance should be 1")

            let bobBalance = await splitter.balances(bob, {from: anyone})
            assert.equal(bobBalance, 2, "Bob final Splitter balance should be 2")

            let carolBalance = await splitter.balances(carol, {from: anyone})
            assert.equal(carolBalance, 2, "Carol final Splitter balance should be 2")
        });

        //TODO add bad depositForSplitDonation tests


        /*
        * Withdraw
        */
        it("Withdraw ", async function() {
            let txObj = await splitter.splitDonation(bob, carol, {from: alice, value: 4});
            truffleAssert.eventEmitted(txObj, 'SplitDonationEvent');

            //wallet before
            let balanceBefore = await web3.eth.getBalancePromise(carol);

            //top up some funds
            let splitterBalance = await splitter.balances(carol, {from: anyone})
            assert.equal(splitterBalance, 2, "Carol final Splitter balance should be 2")

            //lets withdraw
            let receipt = await splitter.withdraw({from: carol})
            let gasUsed = receipt.receipt.gasUsed;
            let tx = await web3.eth.getTransaction(receipt.tx);
            let gasPrice = tx.gasPrice;
            truffleAssert.eventEmitted(receipt, 'WithdrawEvent');

            //wallet after
            let balanceAfter = await web3.eth.getBalancePromise(carol);
            let withdrawCost = gasUsed * gasPrice ;

            let effectiveWithdrawal = new BN(balanceAfter).sub(new BN(balanceBefore)).add(new BN(withdrawCost)).toString(10);

            assert.equal(effectiveWithdrawal, 2);
        });

    });

});
