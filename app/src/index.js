import Web3 from "web3";
import "./app.css";
var contract = require("truffle-contract");
import ecommerceStoreArtifact from "../../build/contracts/EcommerceStore.json";

var EcommerceStore = contract(ecommerceStoreArtifact);

const App = {
  web3: null,
  account: null,

  start: async function() {
    const { web3 } = this;

    EcommerceStore.setProvider(web3.currentProvider);
    renderStore();

    $("#add-item-to-store").submit(function(event) {
      const req = $("#add-item-to-store").serialize();
      let params = JSON.parse(
        '{"' +
          req
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
          '"}'
      );
      let decodedParams = {};
      Object.keys(params).forEach(function(v) {
        decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
      });
      console.log(decodedParams);
      saveProduct(decodedParams);
      event.preventDefault();
    });

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ecommerceStoreArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        ecommerceStoreArtifact.abi,
        deployedNetwork.address
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  }
};

function saveProduct(product) {
  EcommerceStore.deployed()
    .then(function(f) {
      return f.addProductToStore(
        product["product-name"],
        product["product-category"],
        "imageLink",
        "descLink",
        web3.toWei(product["product-price"], "ether"),
        product["product-condition"],
        Date.parse(product["product-start-time"]) / 1000,
        { from: web3.eth.accounts[3], gas: 4700000 }
      );
    })
    .then(function(f) {
      alert("상품이 정상적으로 등록 됐습니다!");
    });
}

function renderStore() {
  //Get the product count
  // Loop through and fetch all products by id
  var instance;
  return EcommerceStore.deployed()
    .then(function(f) {
      instance = f;
      return instance.productIndex.call();
    })
    .then(function(count) {
      for (var i = 1; i <= count; i++) {
        renderProduct(instance, i);
      }
    });
}

function renderProduct(instance, index) {
  instance.getProduct.call(index).then(function(f) {
    let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
    node.append("<div class='title'>" + f[1] + "</div>");
    node.append("<div> Price: " + displayPrice(f[6]) + "</div>");
    if (f[8] === "0x0000000000000000000000000000000000000000") {
      $("#product-list").append(node);
    } else {
      $("#product-purchased").append(node);
    }
  });
}

function displayPrice(amt) {
  return "&Xi;" + web3.fromWei(amt, "ether");
}

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live"
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545")
    );
  }

  App.start();
});
