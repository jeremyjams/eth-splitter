const Splitter = artifacts.require("./Splitter.sol");

contract("Splitter", function() {
    describe("testing user restriction", function() {
      beforeEach("deploy and prepare", function() {
          // Deploy a contract(s) and prepare it up
          // to the pass / fail point
      });

      it("test the failing user", function() {
          // Test something with the bad user
          // in as few steps as possible
      });

      it("test the good user", function() {
          // Test the VERY SAME steps,
          // with only difference being the good user
      });
  });
});
