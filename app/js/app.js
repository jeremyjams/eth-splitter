const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
const Web3Utils = require('web3-utils');
const splitterJson = require("../../build/contracts/Splitter.json");

require("file-loader?name=../index.html!../index.html");

if (typeof ethereum !== 'undefined') {
    // Supports EIP-1102 injected Ethereum providers.
    window.web3 = new Web3(ethereum);
} else if (typeof web3 !== 'undefined') {
    // Supports legacy injected Ethereum providers. (Mist/wallet/Metamask)
    window.web3 = new Web3(web3.currentProvider);
} else {
    // Your preferred fallback.
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);

window.addEventListener('load', async () => {

    if (typeof ethereum !== 'undefined') {
        try {
            $("#allow-accounts").click(allowAccounts(await ethereum.enable()))
            console.log("Using an Ethereum provider with EIP-1102")
        } catch (e) {
            console.error(e)
        }
    } else {
        try {
         allowAccounts(await window.web3.eth.getAccounts())
        } catch (e) {
            console.error(e)
        }
    }

    try {
        $("#split").click(splitDonation)
        $("#refreshSomeoneBalance").click(refreshSomeoneBalance)

        const deployed = await Splitter.deployed();
        const balance = await web3.eth.getBalance(deployed.address)
        $("#contract-splitter-balance").html(balance.toString(10))
    } catch (e) {
        console.error(e)
    }
});

const allowAccounts = async (accounts) => {
    try {
        if (accounts.length == 0) {
            throw new Error("No account with which to transact");
        }
        window.account = accounts[0];
        console.log("Account:", window.account);
        const network = await web3.eth.net.getId();
        console.log("Network:", network.toString(10));

        const account0BalanceWei = await web3.eth.getBalance(accounts[0])
        const account0Balance = await Web3Utils.fromWei(account0BalanceWei)
        $("#account0-address").html(window.account)
        $("#account0-balance").html(account0Balance.toString(10))
    } catch (e) {
        console.error(e)
    }
}

const refreshSomeoneBalance = async () => {
    try {
        const deployed = await Splitter.deployed()
        deployed.balances.call($("#someone").val())
        $("#someone-splitter-balance").html(balance.toString(10))
    } catch (e) {
        console.error(e)
    }
}

const splitDonation = async () => {
    try {
        const gas = 300000;

        const amount = $("input[name='amount']").val()
        const recipientA = $("input[name='recipientA']").val();
        const recipientB = $("input[name='recipientB']").val();

        const deployed = await Splitter.deployed()

        if(amount === "" || isNaN(amount)){
            throw new Error("Positive number required for amount");
        }

        if(recipientA === "" || recipientB === ""){
            throw new Error("Non empty address required for recipients");
        }

        // Simulation first
        const success = await deployed.splitDonation.call(
            recipientA,
            recipientB,
            { from: window.account, gas: gas, value: amount });

        if (!success) {
            throw new Error("The transaction will fail anyway, not sending");
        }
        const txObj = await deployed.splitDonation(
            recipientA,
            recipientB,
           { from: window.account, gas: gas, value: amount })
            .on(
                "transactionHash",
                txHash => $("#status").html("Transaction on the way " + txHash)
            );

        // Waiting for tx
        const receipt = txObj.receipt;
        console.log("got receipt", receipt);
        if (!receipt.status) {
            console.error("Wrong status");
            console.error(receipt);
            $("#status").html("There was an error in the tx execution, status not 1");
        } else if (receipt.logs.length == 0) {
            console.error("Empty logs");
            console.error(receipt);
            $("#status").html("There was an error in the tx execution, missing expected event");
        } else {
            console.log(receipt.logs[0]);
            $("#status").html("Transfer executed");
        }

        //Display recipientA balance
        $("#someone").val(recipientA)
        const someoneBalance = await deployed.balances.call($("#someone").val()) //(could have called refresh)
        $("#someone-splitter-balance").html(someoneBalance.toString(10));

        const contractBalance = await web3.eth.getBalance(deployed.address);
        $("#contract-splitter-balance").html(contractBalance.toString(10));
    } catch (e) {
        $("#status").html(e.toString());
        console.error(e);
    }

};
