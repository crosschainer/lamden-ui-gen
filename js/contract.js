function findURLParameter(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name);
}

async function getContractCodeFromBlockService(contract_name) {
    var url = masternode + "/contracts/" + contract_name;
    const response = await fetch(url)
    const response_json = await response.json()
    const code = await response_json['code']
    return code
}

async function buildUI(contract){
    const pyfunc_regex = new RegExp('^@__export(\\w*[A-Za-z_(): ,!><*-.+{}\\/\'=0-9\\n\\[\\]]*)', 'gm')
    document.getElementById("loading").classList.remove("d-none");
    document.getElementById("loading").classList.add("d-flex");
    let functions = {};

    getContractCodeFromBlockService(contract).then(code =>{
        let pre_functions = [...code.matchAll(pyfunc_regex)];
        let functions_str = [];
        for (group in pre_functions ){
            for (match in group ){
                if(pre_functions[group][match].startsWith("@__export")){
                    functions_str.push(pre_functions[group][match].split("\n").filter(Boolean).join("\n").replace("@__export('"+contract+"')\n", ""));
                }
            }
        }
        
        for (func in functions_str){
            let func_name = functions_str[func].split("(")[0].split(" ")[1];
            let func_args = functions_str[func].split("(")[1].split(")")[0].split(",");
            let func_args_dict = {};
            for (arg in func_args){
                func_args_dict[func_args[arg].split(":")[0].trim()] = func_args[arg].split(":")[1].trim().split("=")[0].trim();
            }
            functions[func_name] = func_args_dict;
        }
        
        for (func in functions){
            arg_template = `<div class="mb-3">
            <label class="form-label">arg_name</label>
            <input type="arg_type" data-type="datatype" class="form-control">
            </div>`;
            container_template = `<div class="col d-flex align-items-stretch" id="ui">
            <form>
                <div class="mb-3">
                    <h5>func_name</h5>
                </div>
                args                       
                <button type="submit" class="btn btn-primary contract-function-submit">Submit Transcation</button>
              </form>
            </div>`;
            let final_args = "";
            for (arg in functions[func]){
                final_arg_template = arg_template.replace("arg_name", arg);
                if(functions[func][arg] == "int"){
                    final_arg_template = final_arg_template.replace("arg_type", "number");
                    final_arg_template = final_arg_template.replace("datatype", "int");
                } else if(functions[func][arg] == "str"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "str");
                } else if(functions[func][arg] == "bool"){
                    final_arg_template = final_arg_template.replace("arg_type", "checkbox").replace("form-control", "form-check-input");
                    final_arg_template = final_arg_template.replace("datatype", "bool");
                } else if(functions[func][arg] == "float"){
                    final_arg_template = final_arg_template.replace("arg_type", "number");
                    final_arg_template = final_arg_template.replace("datatype", "float");
                } else if(functions[func][arg] == "list"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "list");
                } else if(functions[func][arg] == "dict"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "dict");
                } else if(functions[func][arg] == "tuple"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "tuple");
                } else if(functions[func][arg] == "set"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "set");
                } else if(functions[func][arg] == "bytes"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "bytes");
                } else if(functions[func][arg] == "None"){
                    final_arg_template = final_arg_template.replace("arg_type", "text");
                    final_arg_template = final_arg_template.replace("datatype", "None");
                } else {
                    final_arg_template = final_arg_template.replace("arg_type", "number");
                    final_arg_template = final_arg_template.replace("datatype", "int");
                }

                final_args += final_arg_template.replace("arg_name", arg + " type: " + functions[func][arg]);
            }
            
            let final_container = container_template.replace("func_name", func).replace("args", final_args);
            let ui_container = document.getElementById("ui");
            ui_container.innerHTML += final_container;
            
        }
        addClickEventToFuncButtons();
        document.getElementById("loading").classList.remove("d-flex");
        document.getElementById("loading").classList.add("d-none");
    });
    

   
}

var contract = findURLParameter("contract_name");
var masternode = "https://arko-mn-2.lamden.io";

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("contract_name").innerHTML = contract;
    buildUI(contract);
});


// marker for download ui start


var address;
var installed = false;
const toastSuccessElem = document.getElementById('successToast');
const toastFailedElem = document.getElementById('failedToast');
const toastPendingElem = document.getElementById('pendingToast');
const toastSuccess = new bootstrap.Toast(toastSuccessElem);
const toastFailed = new bootstrap.Toast(toastFailedElem);
const toastPending = new bootstrap.Toast(toastPendingElem);

// dapp connection details
const detail = JSON.stringify({
    appName: contract + 'UI',
    version: "1.0.0",
    logo: "logo.png",
    contractName: contract,
    networkType: 'mainnet',
    networkName: "arko"
});

document.addEventListener("readystatechange", () => {
    // ONLOAD GET WALLET
    if (document.readyState == "complete") {
        // Dispatching for Auto Login
        document.dispatchEvent(new CustomEvent("lamdenWalletGetInfo")); // GET WALLET
    }
});

// Connect Button
connectButton = document.getElementById("connect-wallet");
connectButton.addEventListener("click", function() {
    document.dispatchEvent(new CustomEvent("lamdenWalletConnect", { detail }));
});

// Functions Buttons
function addClickEventToFuncButtons() {
    functionButtons = document.getElementsByClassName("contract-function-submit");
    for (i = 0; i < functionButtons.length; i++) {
        functionButtons[i].addEventListener("click", function(event) {
            event.preventDefault();
            
                let function_name = this.parentElement.children[0].innerText;
                let function_args = {};
                for (i = 1; i < this.parentElement.children.length - 1; i++) {
                    let arg_name = this.parentElement.children[i].children[0].innerText;
                    let arg_value = this.parentElement.children[i].children[1].value;
                    let arg_type = this.parentElement.children[i].children[1].getAttribute("data-type");
                    console.log(arg_type)
                    if(arg_type == "int"){
                        function_args[arg_name] = Number(arg_value);
                    } else if(arg_type == "str"){
                        function_args[arg_name] = arg_value;
                    }
                    else if(arg_type == "bool"){
                        if(arg_value == "on"){
                            function_args[arg_name] = true;
                        }
                        else{
                            function_args[arg_name] = false;
                        }
                    }
                    else if(arg_type == "float"){
                        function_args[arg_name] = Number(arg_value);
                    }
                    else if(arg_type == "list"){
                        function_args[arg_name] = JSON.parse(arg_value);
                    }
                    else if(arg_type == "dict"){
                        function_args[arg_name] = JSON.parse(arg_value);
                    }
                    else if(arg_type == "tuple"){
                        function_args[arg_name] = JSON.parse(arg_value);
                    }
                    else if(arg_type == "set"){
                        function_args[arg_name] = JSON.parse(arg_value);
                    }
                    else if(arg_type == "bytes"){
                        function_args[arg_name] = arg_value;
                    }
                    else if(arg_type == "None"){
                        function_args[arg_name] = null;
                    }
                    
                }
               
                

                const detail = JSON.stringify({
                    contractName: contract,
                    methodName: function_name,
                    networkName: "arko",
                    networkType: "mainnet",
                    kwargs: function_args,
                });
                document.dispatchEvent(new CustomEvent("lamdenWalletSendTx", { detail }));
                toastPending.show();
            
        });
    }
}
            

// LAMDEN WALLET INFO RETURN
document.addEventListener("lamdenWalletInfo", (response) => {
    installed = true;
    if (response.detail.errors === undefined) {
        address = response.detail.wallets[0];
        if (response.detail.locked == true) {
            document.getElementById("connect-wallet").innerText = "Wallet is Locked";
            document.getElementById("connect-wallet").classList.remove("btn-primary");
            document.getElementById("connect-wallet").classList.add("btn-warning");
            locked = true;
            connected = false;   
        }
        else{
            document.getElementById("connect-wallet").innerText = "Connected";
            document.getElementById("connect-wallet").classList.remove("btn-primary");
            document.getElementById("connect-wallet").classList.add("btn-success");
            connected = true;
            locked = false;
        }
    }
    else if(response.detail.errors[0] == "Lamden Vault is Locked"){
        document.getElementById("connect-wallet").innerText = "Wallet is Locked";
        document.getElementById("connect-wallet").classList.remove("btn-primary");
        document.getElementById("connect-wallet").classList.add("btn-warning");
        locked = true;
        connected = false;
    }
});

// LAMDEN TX STATUS RETURN FROM VAULT
document.addEventListener("lamdenWalletTxStatus", (response) => {
    if (response.detail.data.resultInfo.title == "Transaction Successful"){
        toastSuccess.show();
    }
    else if (response.detail.data.resultInfo.title == "Transaction Failed"){
        toastFailed.show();
    }
});