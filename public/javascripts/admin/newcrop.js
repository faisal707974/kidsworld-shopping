

    let result = document.querySelector(".result"),
        img_result = document.querySelector(".img-result"),
        img_w = document.querySelector(".img-w"),
        img_h = document.querySelector(".img-h"),
        options = document.querySelector(".options"),
        save = document.querySelector(".save"),
        cropped = document.querySelector(".cropped"),
        dwn = document.querySelector(".download"),
        upload = document.querySelector("#files"),
        cropper = "";



     function crop (e){
         console.log(e.target)
        document.getElementById('imgcrop').hidden = false
        if (e.target.files.length) {
            // start file reader
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target.result) {
                    // create new image
                    let img = document.createElement("img");
                    img.id = "image";
                    img.src = e.target.result;
                    // clean result before
                    result.innerHTML = "";
                    // append new image
                    result.appendChild(img);
                    // show save btn and options
                    // save.classList.remove("hide");
                    // options.classList.remove("hide");
                    // init cropper
                    cropper = new Cropper(img);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    $('#imgcrop').on('click', function(e) {
        console.log(e.target)
        if (e.target !== this)
        return;
        
        imgcrop.hidden=true
      });