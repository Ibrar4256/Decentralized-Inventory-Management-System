const firebaseConfig = {
  apiKey: "AIzaSyDWMbokzw48dVh45OJ4zRp8hjOJvumkYQs",
  authDomain: "inventory-management-e2f52.firebaseapp.com",
  projectId: "inventory-management-e2f52",
  storageBucket: "inventory-management-e2f52.appspot.com",
  messagingSenderId: "372682152682",
  appId: "1:372682152682:web:5b54595ad0d2f72b659593",
  measurementId: "G-5CN6HLB9PY"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

 App = {
  web3Provider: null,
  contracts: {},
  currentUser: null,
  isSigningUp: false,

  init: async function () {
    await App.initAuth();
    return await App.initWeb3();
  },

  initAuth: function() {
    return new Promise((resolve, reject) => {
      auth.onAuthStateChanged(function(user) {
        if (user && !App.isSigningUp) {
          App.currentUser = user;
          $('#auth-section').hide();
          $('#app-content').show();
          $('#user-email').text(user.email);
        } else {
          App.currentUser = null;
          $('#auth-section').show();
          $('#app-content').hide();
          if (!App.isSigningUp) {
            App.showLoginForm();
          }
        }
        resolve();
      });
    });
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

  showLoginForm: function() {
    $('#signup-form').hide();
    $('#login-form').show();
  },

  showSignupForm: function() {
    $('#login-form').hide();
    $('#signup-form').show();
  },


  login: function(event) {
    event.preventDefault();
    const email = $('#login-email').val();
    const password = $('#login-password').val();
    auth.signInWithEmailAndPassword(email, password)
      .then(function() {
        Swal.fire({
          icon: 'success',
          title: 'Logged In!',
          text: 'You have successfully logged in.',
          confirmButtonColor: '#3085d6'
        });
      })
      .catch(function(error) {
        console.error("Error logging in: ", error);
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.message,
          confirmButtonColor: '#d33'
        });
      });
  },


  signup: function(event) {
    event.preventDefault();
    App.isSigningUp = true;
    const email = $('#signup-email').val();
    const password = $('#signup-password').val();
    auth.createUserWithEmailAndPassword(email, password)
      .then(function(userCredential) {
        Swal.fire({
          icon: 'success',
          title: 'Signed Up!',
          text: 'Your account has been created successfully. Please log in.',
          confirmButtonColor: '#3085d6'
        }).then(() => {
          $('#signup-email').val('');
          $('#signup-password').val('');
          return auth.signOut();
        }).then(() => {
          App.isSigningUp = false;
          App.showLoginForm();
        });
      })
      .catch(function(error) {
        console.error("Error signing up: ", error);
        Swal.fire({
          icon: 'error',
          title: 'Signup Failed',
          text: error.message,
          confirmButtonColor: '#d33'
        });
        App.isSigningUp = false;
      });
  },

  logout: function() {
    auth.signOut().then(function() {
      console.log("User signed out");
      Swal.fire({
        icon: 'info',
        title: 'Logged Out',
        text: 'You have been successfully logged out.',
        confirmButtonColor: '#3085d6'
      });
    }).catch(function(error) {
      console.error("Error signing out: ", error);
      Swal.fire({
        icon: 'error',
        title: 'Logout Failed',
        text: 'An error occurred while logging out.',
        confirmButtonColor: '#d33'
      });
    });
  },


  bindEvents: function () {
    $(document).on('click', '#addCourierButton', App.addCourier);
    $(document).on('click', '#removeCourierButton', App.removeCourier);
    $(document).on('click', '#viewCouriersButton', App.viewCouriers);
  },

  addCourier: async function (event) {
    if (!App.currentUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please log in to add inventory',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    event.preventDefault();
    const assetTag = document.getElementById('courierTitle').value;
    const description = document.getElementById('courierDescription').value;
    const category = document.getElementById('inventoryCategory').value;
    const location = document.getElementById('inventoryLocation').value;
    const quantity = parseInt(document.getElementById('inventoryQuantity').value);

    var courierManagerInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while fetching accounts.',
          confirmButtonColor: '#d33'
        });
        return;
      }
      App.contracts.courierManager.deployed().then(async function (instance) {
        courierManagerInstance = instance;

        try {
          const addresses = await courierManagerInstance.getAddresses.call();
          let existingItemId = -1;

          for (let i = 0; i < addresses.length; i++) {
            if (addresses[i] !== '0x0000000000000000000000000000000000000000') {
              const courier = await courierManagerInstance.getCourier(i);
              if (courier[1] === assetTag) {
                existingItemId = i;
                break;
              }
            }
          }

          if (existingItemId !== -1) {
            await courierManagerInstance.updateQuantity(existingItemId, quantity, { from: accounts[0] });
            Swal.fire({
              icon: 'success',
              title: 'Inventory Updated',
              text: `Quantity updated for item ID: ${existingItemId}`,
              confirmButtonColor: '#3085d6'
            });
          } else {
            await courierManagerInstance.addCourier(assetTag, description, category, location, quantity, { from: accounts[0] });
            Swal.fire({
              icon: 'success',
              title: 'Inventory Added',
              text: 'New inventory item has been added successfully.',
              confirmButtonColor: '#3085d6'
            });
          }

          // Clear the form
          document.getElementById('courierTitle').value = '';
          document.getElementById('courierDescription').value = '';
          document.getElementById('inventoryCategory').value = '';
          document.getElementById('inventoryLocation').value = '';
          document.getElementById('inventoryQuantity').value = '';

          // Refresh the inventory list
          App.viewCouriers(event);
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while adding/updating inventory.',
            confirmButtonColor: '#d33'
          });
        }
      }).catch(function (err) {
        console.log(err.message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while deploying the contract.',
          confirmButtonColor: '#d33'
        });
      });
    });
  },

  removeCourier: async function (event) {
    if (!App.currentUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please log in to issue inventory',
        confirmButtonColor: '#3085d6'
      });
      return;
    } else if (App.currentUser.email !== "admin@gmail.com") {
      console.log("Email", App.currentUser.email);
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'You are not authorized to issue inventory',
        confirmButtonColor: '#d33'
      });
      return;
    }
    event.preventDefault();

    const id = parseInt(document.getElementById('courierId').value);
    const quantityToRemove = parseInt(document.getElementById('quantityToRemove').value);

    if (isNaN(quantityToRemove) || quantityToRemove <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Quantity',
        text: 'Please enter a valid quantity to remove.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    var courierManagerInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while fetching accounts.',
          confirmButtonColor: '#d33'
        });
        return;
      }

      var account = accounts[0];
      App.contracts.courierManager.deployed().then(async function (instance) {
        courierManagerInstance = instance;

        try {
          await courierManagerInstance.removeCourier(id, quantityToRemove, { from: account });
          Swal.fire({
            icon: 'success',
            title: 'Inventory Issued',
            text: 'Quantity removed successfully',
            confirmButtonColor: '#3085d6'
          });
        } catch (err) {
          console.log(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error removing quantity: ' + err.message,
            confirmButtonColor: '#d33'
          });
        }
      }).catch(function (err) {
        console.log(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while deploying the contract.',
          confirmButtonColor: '#d33'
        });
      });
    });
  },

  viewCouriers: async function (event) {
    if (!App.currentUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please log in to view inventory',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    event.preventDefault();
    var courierManagerInstance;
    const courierList = document.getElementById('courierList');
  
    courierList.innerHTML = '';
  
    try {
      courierManagerInstance = await App.contracts.courierManager.deployed();
      const addresses = await courierManagerInstance.getAddresses.call();
      let lowQuantityItems = [];
      let itemCount = 0;
  
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i] !== '0x0000000000000000000000000000000000000000') {
          itemCount++;
          const courier = await courierManagerInstance.getCourier(i);
          const quantity = parseInt(courier[5].toString());
          
          if (quantity < 5) {
            lowQuantityItems.push(`${courier[1]} (ID: ${i}, Quantity: ${quantity})`);
          }
  
          const card = document.createElement('div');
          card.className = 'inventory-card';
          card.innerHTML = `
            <div class="card-header">
              <h3 class="category">${courier[3]}</h3>
              <span class="quantity">Quantity: ${quantity}</span>
            </div>
            <div class="card-body">
              <p class="asset-tag">${courier[1]}</p>
              <p class="description">${courier[2]}</p>
              <p class="location">${courier[4]}</p>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary re-order-btn" data-id="${i}">Re-order</button>
              <button class="btn btn-warning issue-btn" data-id="${i}" data-asset="${courier[1]}">Issue Inventory</button>
              <button class="btn btn-info history-btn" data-id="${i}">History</button>
            </div>
          `;
          courierList.appendChild(card);
  
          card.querySelector('.re-order-btn').addEventListener('click', App.handleReorder);
          card.querySelector('.issue-btn').addEventListener('click', App.handleIssue);
          card.querySelector('.history-btn').addEventListener('click', App.handleHistory);
        }
      }
  

      if (itemCount === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Inventory',
          text: 'There are no items in the inventory.',
          confirmButtonColor: '#3085d6'
        });
      } else if (lowQuantityItems.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Low Quantity Alert',
          html: `The following items have low quantity (less than 5) and should be re-ordered:<br><br>${lowQuantityItems.join('<br>')}`,
          confirmButtonColor: '#3085d6'
        });
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while fetching inventory.',
        confirmButtonColor: '#d33'
      });
    }
  },

  handleIssue: function(event) {
    const id = event.target.getAttribute('data-id');
    const assetTag = event.target.getAttribute('data-asset');
    
    document.getElementById('courierId').value = id;
    document.getElementById('courierTitle').value = assetTag;
    document.getElementById('quantityToRemove').value = '';
    document.getElementById('quantityToRemove').focus();
  
    document.querySelector('.forms').scrollIntoView({ behavior: 'smooth' });
  
    Swal.fire({
      icon: 'info',
      title: 'Issue Inventory',
      text: 'The issue form has been pre-filled. Please enter the quantity to issue and submit.',
      confirmButtonColor: '#3085d6'
    });
  },
  
  handleHistory: function(event) {
    const id = event.target.getAttribute('data-id');
    
    Swal.fire({
      icon: 'info',
      title: 'History',
      text: `Viewing history for item ID: ${id}. This feature is not yet implemented.`,
      confirmButtonColor: '#3085d6'
    });
  },
  
  // Update the handleReorder function
  handleReorder: async function(event) {
    const id = event.target.getAttribute('data-id');
    try {
      const courierManagerInstance = await App.contracts.courierManager.deployed();
      const courier = await courierManagerInstance.getCourier(id);
      
      document.getElementById('inventoryCategory').value = courier[3];
      document.getElementById('courierTitle').value = courier[1];
      document.getElementById('courierDescription').value = courier[2];
      document.getElementById('inventoryQuantity').value = '';
      document.getElementById('inventoryLocation').value = courier[4];
  
      document.querySelector('.forms').scrollIntoView({ behavior: 'smooth' });
  
      Swal.fire({
        icon: 'info',
        title: 'Re-order',
        text: 'The re-order form has been pre-filled. Please enter the quantity and submit to update the inventory.',
        confirmButtonColor: '#3085d6'
      });
    } catch (err) {
      console.error('Error handling reorder:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while handling the re-order.',
        confirmButtonColor: '#d33'
      });
    }
  },  }

$(function () {
  $(window).load(function () {
    App.init();
    // App.showLoginForm();
});

$('#show-signup').on('click', App.showSignupForm);
$('#show-login').on('click', App.showLoginForm);

// Modify existing event listeners
$('#login-form-element').on('submit', App.login);
$('#signup-form-element').on('submit', App.signup);
$('#logout-button').on('click', App.logout);
});





