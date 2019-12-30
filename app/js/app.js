const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
// Not to forget our built contract
const splitterJson = require("../../build/contracts/Splitter.json");

require("file-loader?name=../index.html!../index.html");

// Supports Metamask, and other wallets that provide / inject 'web3'.
if (typeof web3 !== 'undefined') {
    // Use the Mist/wallet/Metamask provider.
    window.web3 = new Web3(web3.currentProvider);
} else {
    // Your preferred fallback.
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}


const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);


window.addEventListener('load', function() {
    return web3.eth.getAccounts()
        .then(accounts => {
            if (accounts.length == 0) {
                $("#contract-splitter-balance").html("N/A");
                throw new Error("No account with which to transact");
            }
            window.account = accounts[0];
            console.log("Account:", window.account);
            return web3.eth.net.getId();
        })
        .then(network => {
            console.log("Network:", network.toString(10));
            return Splitter.deployed();
        })
        .then(deployed => web3.eth.getBalance(deployed.address))
        .then(balance => $("#contract-splitter-balance").html(balance.toString(10)))
        // We wire it when the system looks in order.
        .then(() => $("#split").click(splitDonation))
        .then(() => $("#refreshSomeoneBalance").click(refreshSomeoneBalance))
	    // Never let an error go unlogged.
        .catch(console.error);
});

const refreshSomeoneBalance = function() {
    return Splitter.deployed()
        .then(deployed => deployed.balances.call($("#someone").val()))
        .then(balance => $("#someone-splitter-balance").html(balance.toString(10)))
        .catch(e => {
            console.error(e);
        });
}

const splitDonation = function() {
    const gas = 300000; let deployed;

    let amount = $("input[name='amount']").val()
    let recipientA = $("input[name='recipientA']").val();
    let recipientB = $("input[name='recipientB']").val();

    return Splitter.deployed()
        .then(_deployed => {
            if(amount === "" || isNaN(amount)){
                throw new Error("Positive number required for amount");
            }

            if(recipientA === "" || recipientB === ""){
                throw new Error("Non empty address required for recipients");
            }

            deployed = _deployed

            // Simulation first
            return deployed.splitDonation.call(
                recipientA,
                recipientB,
                { from: window.account, gas: gas, value: amount });
        })
        .then(success => {
            if (!success) {
                throw new Error("The transaction will fail anyway, not sending");
            }
            return deployed.splitDonation(
                recipientA,
                recipientB,
               { from: window.account, gas: gas, value: amount })
                .on(
                    "transactionHash",
                    txHash => $("#status").html("Transaction on the way " + txHash)
                );
        })
        // Waiting for tx
        .then(txObj => {
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

            return deployed.balances.call($("#someone").val()) //(could have called refresh)
        })
        .then(balance => {
            $("#someone-splitter-balance").html(balance.toString(10))
            return web3.eth.getBalance(deployed.address);
         })
        .then(balance => $("#contract-splitter-balance").html(balance.toString(10)))
        .catch(e => {
            $("#status").html(e.toString());
            console.error(e);
        });
};
