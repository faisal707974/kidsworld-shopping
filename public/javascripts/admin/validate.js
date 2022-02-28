validate()
function validate(data) {

    let pattern = null
    let errMsgId = null
    let errorMessage = null

    let inputText = document.getElementById(data.id).value
    const self = (function(path)  {
        parent = {
            username:false,
            description:false
        }
        return   function(){
            if (inputText.match(pattern)) {
                document.getElementById(errMsgId).innerHTML = ""
                path  = true
                return true
            } else {
                document.getElementById(errMsgId).innerHTML = errorMessage
                return false
            }
        }
    })();

    if (data.username) {
        pattern = /^[a-z A-Z]+$/
        errMsgId = 'errName'
        errorMessage = "alphabets only"
        parent.username = self(username)
    }else if(data.description){
        pattern = /^[a-z A-Z]+$/
        errMsgId = 'errDesc'
        errorMessage = "alphabets only"
        parent.description = self()
    }

  

    console.log(parent)

}

function validSubmit(){
}



// console.log(document.getElementById('addProductForm'));
// document.getElementById('addProductForm').addEventListener('submit', e => {
//     e.preventDefault()
//     console.log("here");
// })




// if(username.status){
//     console.log('fine')
//     console.log(username.status)
// }else{
//     console.log('error')
// }