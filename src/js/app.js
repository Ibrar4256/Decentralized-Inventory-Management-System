 App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    console.log('Web3 initialized', web3);

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

    });
    $(document).ready(function () {
      $("#account-number").html(web3.eth.accounts[0]);
    });
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('CourierManager.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var courierManagerArtifact = data;
      App.contracts.courierManager = TruffleContract(courierManagerArtifact);

      // Set the provider for our contract
      App.contracts.courierManager.setProvider(App.web3Provider);
    });
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '#addCourierButton', App.addCourier);
    $(document).on('click', '#removeCourierButton', App.removeCourier);
    $(document).on('click', '#viewCouriersButton', App.viewCouriers);
  },

  addCourier: async function (event) {
    event.preventDefault();
    const title = document.getElementById('courierTitle').value;
    const description = document.getElementById('courierDescription').value;
    const category = document.getElementById('inventoryCategory').value;
    const location = document.getElementById('inventoryLocation').value;
    const quantity = parseInt(document.getElementById('inventoryQuantity').value);
  

    // const value = web3._extend.utils.toWei(document.getElementById('courierValue').value, 'ether');

    var courierManagerInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      App.contracts.courierManager.deployed().then(async function (instance) {
        courierManagerInstance = instance;

        // const fixedAmount = web3._extend.utils.toWei("0.01", "ether"); // Fixed value for transaction
        await courierManagerInstance.addCourier(title, description, category, location, quantity , { from: accounts[0]});
        console.log("Inventory added by", accounts[0]);

        const addresses = await courierManagerInstance.getAddresses.call();
         console.log("Inventory addresses:", addresses);
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },

  removeCourier: async function (event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('courierId').value);
    var courierManagerInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.courierManager.deployed().then(async function (instance) {
        courierManagerInstance = instance;
        await courierManagerInstance.removeCourier(id, { from: account });
        console.log("Inventory Issued");

      }).catch(function (err) {
        console.log(err);
      });
    })
  },

  viewCouriers: async function (event) {
    event.preventDefault();
    var courierManagerInstance;
    const courierList = document.getElementById('courierList');

    courierList.innerHTML = ''; // Clear the list before adding new entries

    try {
        // Get the deployed instance of the contract
        courierManagerInstance = await App.contracts.courierManager.deployed();

        // Call getAddresses to get the list of courier addresses
        const addresses = await courierManagerInstance.getAddresses.call();
        console.log(addresses[0]);
        // Loop through addresses and fetch courier details
        for (let i = 0; i < addresses.length; i++) {
            // Check if the address is valid
            if (addresses[i] !== '0x0000000000000000000000000000000000000000') {
                const courier = await courierManagerInstance.getCourier(i);
                console.log(courier);
                console.log('Inventory details:', courier);

                // Create and append a card for each courier
                const card = document.createElement('div');
                card.className = 'card parcel-card';
                card.style.width = '18rem';

                card.innerHTML = `
                     <h2>${courier[3]}</h2>
                    <img class="card-img-top" height="100px" width="100px" src="/images/courier.png" alt="Card image cap">
                    <h3>${courier[1]}</h3>
                    <p>${courier[2]}</p>
                    <h5>${courier[4]}</h5>
                    <div class="id-marker">&nbsp ${courier[5].c[0]} &nbsp </div>
                `;
                courierList.appendChild(card);
            }
        }
    } catch (err) {
        console.log('Error:', err.message);
    }
}

  }

$(function () {
  $(window).load(function () {
    App.init();
  });
});





