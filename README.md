# eth-splitter
ETH Splitter

## What?

* there are 3 people: Alice, Bob and Carol.
* we can see the balance of the Splitter contract on the Web page.
` web3.eth.getBalance('0xmyContract')`
* whenever Alice sends ether to the contract for it to be split, half of it goes to Bob and the other half to Carol.
`Splitter.deployed().then(instance => instance.depositForSplitDonation(accounts[1], accounts[2], {from: accounts[0], value: 4}))`
* we can see the balances of Alice, Bob and Carol on the Web page.
`Splitter.deployed().then(instance => instance.viewBalance(accounts[1], {from: accounts[0]}))`
* Alice can use the Web page to split her ether.

WepApp
`./node_modules/.bin/webpack-cli --mode development && npx http-server ./build/app/ -a 0.0.0.0 -p 8888 -c-1`



`code` from Truffle
