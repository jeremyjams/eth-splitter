const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
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

const { fromWei } = web3.utils

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
        $("#refreshAllBalances").click(refreshAllBalances)
        $("#withdraw").click(withdraw)
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
        $("#my-eth-address").html(window.account)

        refreshAllBalances()
    } catch (e) {
        console.error(e)
    }
}

//Lets keep distinct refresh functions in case of multiple refresh buttons
const refreshContractEthBalance = async () => {
    try {
        const deployed = await Splitter.deployed();
        const contractBalance = await web3.eth.getBalance(deployed.address);
        $("#contract-eth-balance").html(contractBalance.toString(10));
    } catch (e) {
        console.error(e)
    }
}

const refreshMyEthBalance = async () => {
    try {
        const account0BalanceWei = await web3.eth.getBalance(window.account)
        const account0Balance = await fromWei(account0BalanceWei)
        $("#my-eth-balance").html(account0Balance.toString(10))
    } catch (e) {
        console.error(e)
    }
}

const refreshSplitterBalance = async () => {
    try {
        const deployed = await Splitter.deployed();
        const balance = await web3.eth.getBalance(deployed.address)
        $("#contract-eth-balance").html(balance.toString(10));
    } catch (e) {
        console.error(e)
    }
}

const refreshMySplitterBalance = async () => {
    try {
        const deployed = await Splitter.deployed();
        const account0SplitterBalance = await deployed.balances.call(window.account)
        $("#my-splitter-balance").html(account0SplitterBalance.toString(10))
    } catch (e) {
        console.error(e)
    }
}

const refreshSomeoneSplitterBalance = async () => {
    try {
        const deployed = await Splitter.deployed()
        const someone = $("#someone").val()
        if(someone != ""){
            const balance = await deployed.balances.call(someone)
            $("#someone-splitter-balance").html(balance.toString(10))
        } else {
            $("#someone-splitter-balance").html("N/A")
        }
    } catch (e) {
        console.error(e)
    }
}

const refreshAllBalances = async () => {
    await refreshContractEthBalance();
    await refreshMyEthBalance();
    await refreshSplitterBalance();
    await refreshMySplitterBalance();
    await refreshSomeoneSplitterBalance();
}

const splitDonation = async () => {
    try {
        $("#status").html("");
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

        refreshAllBalances()
    } catch (e) {
        $("#status").html(e.toString());
        console.error(e);
    }
};

const withdraw = async () => {
    try {
        $("#status").html("");

        const gas = 300000;

        const deployed = await Splitter.deployed()
        const mySplitterBalance = await deployed.balances.call(window.account)

        if(mySplitterBalance.toString(10) == "0"){
            throw new Error("Positive balance required for withdraw");
        }

        // Simulation first
        const success = await deployed.withdraw.call(
            { from: window.account, gas: gas }
            );

        if (!success) {
            throw new Error("The transaction will fail anyway, not sending");
        }
        const txObj = await deployed.withdraw(
             { from: window.account, gas: gas }
           )
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

        refreshAllBalances()
    } catch (e) {
        $("#status").html(e.toString());
        console.error(e);
    }
};
