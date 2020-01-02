const Splitter = artifacts.require("./Splitter.sol");
const truffleAssert = require('truffle-assertions');

const { BN, toBN } = web3.utils
require('chai').use(require('chai-bn')(BN)).should();

// ganache-cli --accounts=10 --host=0.0.0.0

contract("Splitter", accounts => {
    describe("Testing Splitter contract", () => {

        let splitter, alice, bob, carol, anyone;

        beforeEach("Fresh contract & accounts", async () => {
            alice = accounts[1]
            bob = accounts[2]
            carol = accounts[3]
            anyone = accounts[9]
            const ONE_MILLION_WEI = toBN(1000000)

            splitter = await Splitter.new(false, {from: alice})

            const aliceWeiBalance = await web3.eth.getBalance(alice)
            //const aliceBalance = await web3.utils.fromWei(aliceWeiBalance)
            aliceWeiBalance.should.be.bignumber.greaterThan(ONE_MILLION_WEI)

            const bobWeiBalance = await web3.eth.getBalance(bob)
            bobWeiBalance.should.be.bignumber.greaterThan(ONE_MILLION_WEI)

            const carolWeiBalance = await web3.eth.getBalance(carol)
            carolWeiBalance.should.be.bignumber.greaterThan(ONE_MILLION_WEI)

            const aliceSplitterBalance = await splitter.balances(alice, {from: anyone})
            assert.strictEqual(aliceSplitterBalance.toString(10), "0", "Alice initial Splitter balance should be 0")
            const bobSplitterBalance = await splitter.balances(bob, {from: anyone})
            assert.strictEqual(bobSplitterBalance.toString(10), "0", "Bob initial Splitter balance should be 0")
            const carolSplitterBalance = await splitter.balances(carol, {from: anyone})
            assert.strictEqual(carolSplitterBalance.toString(10), "0", "Carol initial Splitter balance should be 0")

            const contractBalance = await web3.eth.getBalance(splitter.address)
            assert.strictEqual(contractBalance.toString(10), "0", "Contract balance should be 0")
        });

        /*
        * Split
        */
        it("splitDonation (even donation)", async () => {
            const txObj = await  splitter.splitDonation(bob, carol, {from: alice, value: 4})
            //truffleAssert.prettyPrintEmittedEvents(txObj);
            truffleAssert.eventEmitted(txObj, 'SplitDonationEvent',
            { giver: alice, donation: toBN(4), beneficiaryA: bob, beneficiaryB: carol});
            //console.log(txObj.logs[0])

            const aliceBalance = await splitter.balances(alice, {from: anyone})
            assert.strictEqual(aliceBalance.toString(10), "0", "Alice final Splitter balance should be 0")
            const bobBalance = await splitter.balances(bob, {from: anyone})
            assert.strictEqual(bobBalance.toString(10), "2", "Bob final Splitter balance should be 2")
            const carolBalance = await splitter.balances(carol, {from: anyone})
            assert.strictEqual(carolBalance.toString(10), "2", "Carol final Splitter balance should be 2")

            const contractBalance = await web3.eth.getBalance(splitter.address)
            assert.strictEqual(contractBalance.toString(10), "4", "Contract balance should be 4")
        });

        it("splitDonation (odd donation)", async () => {
            const txObj = await  splitter.splitDonation(bob, carol, {from: alice, value: 5})
            truffleAssert.eventEmitted(txObj, 'SplitDonationEvent',
            { giver: alice, donation: toBN(5), beneficiaryA: bob, beneficiaryB: carol});

            const aliceBalance = await splitter.balances(alice, {from: anyone})
            assert.strictEqual(aliceBalance.toString(10), "1", "Alice final Splitter balance should be 1")
            const bobBalance = await splitter.balances(bob, {from: anyone})
            assert.strictEqual(bobBalance.toString(10), "2", "Bob final Splitter balance should be 2")
            const carolBalance = await splitter.balances(carol, {from: anyone})
            assert.strictEqual(carolBalance.toString(10), "2", "Carol final Splitter balance should be 2")

            const contractBalance = await web3.eth.getBalance(splitter.address)
            assert.strictEqual(contractBalance.toString(10), "5", "Contract balance should be 5")
        });

        it("splitDonation (non empty beneficiary balance 2+2 on Bob)", async () => {
            //Let's create a non empty balance on bob & carol (1st split)
            await splitter.splitDonation(bob, carol, {from: alice, value: 4})

            //Let's try a 2nd split
            const split2txObj = await  splitter.splitDonation(bob, carol, {from: alice, value: 4})
            truffleAssert.eventEmitted(split2txObj, 'SplitDonationEvent',
            { giver: alice, donation: toBN(4), beneficiaryA: bob, beneficiaryB: carol});
            const aliceBalance = await splitter.balances(alice, {from: anyone})
            assert.strictEqual(aliceBalance.toString(10), "0", "Alice final Splitter balance should be 0")
            const bobBalance = await splitter.balances(bob, {from: anyone})
            assert.strictEqual(bobBalance.toString(10), "4", "Bob final Splitter balance should be 4")
            const carolBalance = await splitter.balances(carol, {from: anyone})
            assert.strictEqual(carolBalance.toString(10), "4", "Carol final Splitter balance should be 4")

            const contractBalance = await web3.eth.getBalance(splitter.address)
            assert.strictEqual(contractBalance.toString(10), "8", "Contract balance should be 8")
        });

        it("splitDonation (non empty beneficiary balance 3+5 on Bob)", async () => {
            //Let's create a non empty balance on bob & carol (1st split)
            await splitter.splitDonation(bob, carol, {from: alice, value: 6})

            //Let's try a 2nd split
            const split2txObj = await splitter.splitDonation(bob, carol, {from: alice, value: 10})
            truffleAssert.eventEmitted(split2txObj, 'SplitDonationEvent',
            { giver: alice, donation: toBN(10), beneficiaryA: bob, beneficiaryB: carol});

            const aliceBalance = await splitter.balances(alice, {from: anyone})
            assert.strictEqual(aliceBalance.toString(10), "0", "Alice final Splitter balance should be 0")
            const bobBalance = await splitter.balances(bob, {from: anyone})
            assert.strictEqual(bobBalance.toString(10), "8", "Bob final Splitter balance should be 8")
            const carolBalance = await splitter.balances(carol, {from: anyone})
            assert.strictEqual(carolBalance.toString(10), "8", "Carol final Splitter balance should be 8")

            const contractBalance = await web3.eth.getBalance(splitter.address)
            assert.strictEqual(contractBalance.toString(10), "16", "Contract balance should be 16")
        });

        //TODO add bad depositForSplitDonation tests


        /*
        * Withdraw
        */
        it("Withdraw ", async () => {
            //wallet before
            const balanceBefore = await web3.eth.getBalance(carol);

            //top up some funds
            await splitter.splitDonation(bob, carol, {from: alice, value: 4});

            //lets withdraw
            const receipt = await splitter.withdraw({from: carol})
            const withdrawGasUsed = receipt.receipt.gasUsed;
            const tx = await web3.eth.getTransaction(receipt.tx);
            const withdrawGasPrice = tx.gasPrice;
            truffleAssert.eventEmitted(receipt, 'WithdrawEvent');

            //wallet after
            const balanceAfter = await web3.eth.getBalance(carol);
            const withdrawCost = toBN(withdrawGasUsed).mul(toBN(withdrawGasPrice));

            const effectiveWithdrawal = toBN(balanceAfter).sub(toBN(balanceBefore))
                .add(toBN(withdrawCost)).toString(10);

            assert.strictEqual(effectiveWithdrawal.toString(10), "2");
        });

    });

});
