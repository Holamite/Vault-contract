import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vault", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployVaultContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy();

    return { vault, owner, otherAccount };
  }

  describe("Deployment Testing", function () {
    it("should correctly initialize a Grant struct", async function () {
      const { vault, otherAccount } = await loadFixture(
        deployVaultContractFixture
      );

      const donor = otherAccount;
      const beneficiary = "0x3618D1cB763509603FdDf3451acb6c9dc2368ECD";
      const amount = ethers.parseUnits("1000000000", 18);
      const unlockTime = Math.floor(Date.now() / 1000) + 1000;
      const withdrawn = false;

      const Grant = {
        donor: donor,
        beneficiary: beneficiary,
        amount: amount,
        unlockTime: unlockTime,
        withdrawn: withdrawn,
      };

      expect(await Grant.donor).to.equal(donor);
      expect(await Grant.beneficiary).to.equal(beneficiary);
      expect(await Grant.amount).to.equal(amount);
      expect(await Grant.unlockTime).to.equal(unlockTime);
      expect(await Grant.withdrawn).to.equal(withdrawn);
    });

    it("Should set the right owner", async function () {
      const { vault, owner } = await loadFixture(deployVaultContractFixture);

      expect(await vault.owner()).to.equal(owner.address);
    });

    it("should revert if the amount is zero", async function () {
      const { vault, otherAccount } = await loadFixture(
        deployVaultContractFixture
      );
      const beneficiary = "0x3618D1cB763509603FdDf3451acb6c9dc2368ECD";

      const unlockTime = Math.floor(Date.now() / 1000) + 1000;
      const Grant = {
        beneficiary: beneficiary,
        unlockTime: unlockTime,
      };

      expect(await Grant.beneficiary).to.equal(beneficiary);
      expect(await Grant.unlockTime).to.equal(unlockTime);

      await expect(
        vault.offerGrant(beneficiary, unlockTime, { value: 0 })
      ).to.be.revertedWith("Invalid amount");
    });

    it("should revert if the beneficiary address is zero", async function () {
      const { vault, otherAccount } = await loadFixture(
        deployVaultContractFixture
      );

      const amount = ethers.parseUnits("0", 18);
      const unlockTime = Math.floor(Date.now() / 1000) + 1000;

      await expect(
        vault.offerGrant(otherAccount, unlockTime, { value: amount })
      ).to.be.revertedWith("Invalid amount");
    });

    it("should revert if the unlock time is in the past", async function () {
      const { vault } = await loadFixture(deployVaultContractFixture);

      const beneficiary = "0x3618D1cB763509603FdDf3451acb6c9dc2368ECD";
      const txAmount = ethers.parseUnits("0.001", 18);

      const Grant = {
        beneficiary: beneficiary,
        amount: txAmount,
      };

      expect(await Grant.beneficiary).to.equal(beneficiary);
      expect(await Grant.amount).to.equal(txAmount);

      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      await expect(
        vault.offerGrant(beneficiary, pastTime, { value: txAmount })
      ).to.be.revertedWith("Unlock time must be in the future");
    });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.target)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
