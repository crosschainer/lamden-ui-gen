// Custom Contract Modal
goToCustomContract = document.getElementById("go-to-custom-contract");
goToCustomContract.addEventListener("click", function() {
    contract = document.getElementById("custom-contract").value;
    if (contract.startsWith("con_") && contract.length != 0) {
        window.location.href = "./contract.html?contract_name=con_rocketswap_official_v1_1";
    }
});