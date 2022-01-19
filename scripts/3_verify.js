#!/usr/bin/env node
const chalk = require ('chalk');
const util = require ('util');
const exec = util.promisify (require ('child_process').exec);
const hardhat = require ('hardhat');
const {deployments} = require ('hardhat');
const {
  deployContractName,
  deploy: deployParameters,
} = require ('../production/testnet.json');

const info = msg => console.log (chalk.dim (msg));
const success = msg => console.log (chalk.green (msg));
const error = msg => console.error (chalk.red (msg));

const getContract = async name => {
  const {deployments} = hardhat;
  const signers = await hardhat.ethers.getSigners ();
  return hardhat.ethers.getContractAt (
    name,
    (await deployments.get (name)).address,
    signers[0]
  );
};

const verifyAddress = async (address, contractName, options = '') => {
  try {
    const cmd = `hardhat --show-stack-traces ${getHardhatConfigFile ()} verify --network ${hardhat.network.name} ${address} ${options}`;
    info (`Verifying ${contractName}...`);
    info (cmd);
    await exec (cmd.trim ());
    success (`Verified ${contractName}!`);
  } catch (e) {
    if (/Contract source code already verified/.test (e.message)) {
      info (`${contractName} already verified`);
    } else {
      error (e.message);
      console.error (e);
    }
  }
};

const verifyAddressManually = async (address, contractName, args = '') => {
  const artifact = await hardhat.artifacts.readArtifact (contractName);
  const contractFlag = `--contract ${artifact.sourceName}:${contractName} ${args}`;
  await verifyAddress (address, contractName, contractFlag);
};

const contractAddress = async contractName => {
  const contract = await getContract (contractName);
  return contract.address;
};

function isBinance () {
  const network = hardhat.network.name;
  return /bsc/.test (network) || /bscTestnet/.test (network);
}

function isPolygon () {
  const network = hardhat.network.name;
  return (
    /polygon/.test (network) ||
    /matic/.test (network) ||
    /mumbai/.test (network)
  );
}

function getHardhatConfigFile () {
  let config;
  if (isBinance ()) {
    config = '--config hardhat.config.bsc.js';
  } else if (isPolygon ()) {
    config = '--config hardhat.config.polygon.js';
  } else {
    config = '';
  }
  return config;
}

async function run () {
  const network = hardhat.network.name;

  info (`Verifying top-level contracts on network: ${network}`);

  if (isBinance () || isPolygon ()) {
    info (`verifying using hack`);
    const contracts = await deployments.all ();
    const contractNames = Object.keys (contracts);
    for (var i = 0; i < contractNames.length; i++) {
      const contractName = contractNames[i];
      const contract = contracts[contractName];
      const args = contract.args.map (arg => arg.toString ()).join (' ');
      await verifyAddressManually (contract.address, contractName, args);
    }
  } else {
    info (`verifying using Hardhat verify`);
    // using hardhat native etherscan verify -- this supports mainnet, rinkeby, kovan etc.
    const cmd = `hardhat --network ${network} etherscan-verify --solc-input --api-key ${hardhat.config.etherscan.apiKey}`;
    info (cmd);
    const {stdout, stderr} = await exec (cmd);
    console.log (chalk.yellow (stdout));
    console.log (chalk.red (stderr));
  }

  info (`Done top-level contracts`);

  info (`Verifying ${deployContractName} contract...`);

  await verifyAddressManually (
    await contractAddress (deployContractName),
    deployContractName,
    // todo: fix; r.e right now its manually inserting the deploy constructors of \"production/testnet.json\"
    '0xc65b72b028415a7b64ca3da340d1f0540f146cc996de566d9c0c5a28db654745 120 5 10 50000000000000000'
  );

  success ('Done!');
}

run ();
