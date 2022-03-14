
var c;
var galleryImagesContainer = document.getElementById('galleryImages');
var imageCropFileInput = document.getElementById('file');
var cropperImageInitCanvas = document.getElementById('cropperImg');
var cropImageButton = document.getElementById('cropImageBtn');
// Crop Function On change
function imagesPreview(input) {
    var cropper;
    //cropImageButton.className = 'show';
    var img = [];
    if (input.files.length) {
        var i = 0;
        var index = 0;
        for (let singleFile of input.files) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var blobUrl = event.target.result;
                img.push(new Image());
                img[i].onload = function (e) {
                    document.getElementById('imgcrop').hidden = false
                    // Canvas Container
                    var singleCanvasImageContainer = document.createElement('div');
                    singleCanvasImageContainer.id = 'singleImageCanvasContainer' + index;
                    singleCanvasImageContainer.className = 'singleImageCanvasContainer';
                    // Canvas Close Btn
                    var singleCanvasImageCloseBtn = document.createElement('button');
                    var singleCanvasImageCloseBtnText = document.createTextNode('X');
                    // var singleCanvasImageCloseBtnText = document.createElement('i');
                    // singleCanvasImageCloseBtnText.className = 'fa fa-times';
                    singleCanvasImageCloseBtn.id = 'singleImageCanvasCloseBtn' + index;
                    singleCanvasImageCloseBtn.className = 'singleImageCanvasCloseBtn';
                    singleCanvasImageCloseBtn.classList.add("btn", "btn-sm");
                    singleCanvasImageCloseBtn.onclick = function () {
                        removeSingleCanvas(this)
                    };
                    singleCanvasImageCloseBtn.appendChild(singleCanvasImageCloseBtnText);
                    singleCanvasImageContainer.appendChild(singleCanvasImageCloseBtn);
                    // Image Canvas
                    var canvas = document.createElement('canvas');
                    canvas.id = 'imageCanvas' + index;
                    canvas.className = 'imageCanvas singleImageCanvas';
                    canvas.width = e.currentTarget.width;
                    canvas.height = e.currentTarget.height;
                    canvas.onclick = function () { cropInit(canvas.id); };
                    singleCanvasImageContainer.appendChild(canvas)
                    // Canvas Context
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(e.currentTarget, 0, 0);
                    // galleryImagesContainer.append(canvas);
                    galleryImagesContainer.appendChild(singleCanvasImageContainer);
                    // while (document.querySelectorAll('.singleImageCanvas').length == input.files.length) {
                    //     var allCanvasImages = document.querySelectorAll('.singleImageCanvas')[0].getAttribute('id');
                    //     console.log(allCanvasImages);
                    //     //commented by sam
                    //     //cropInit(allCanvasImages);
                    //     break;
                    // };
                    urlConversion();
                    index++;
                };
                img[i].src = blobUrl;
                i++;
            }
            reader.readAsDataURL(singleFile);
        }
    }
}

imageCropFileInput.addEventListener("change", function (event) {

    $('#cropperModal').modal('show');
    var mediaValidation = validatePostMedia(event.target.files);
    if (!mediaValidation) {
        var $el = $('#file');
        $el.wrap('<form>').closest('form').get(0).reset();
        $el.unwrap();
        return false;
    }

    $('#mediaPreview').empty();
    $('.singleImageCanvasContainer').remove();
    if (cropperImageInitCanvas.cropper) {
        cropperImageInitCanvas.cropper.destroy();
        cropperImageInitCanvas.width = 0;
        cropperImageInitCanvas.height = 0;
        cropImageButton.style.display = 'none';
    }
    imagesPreview(event.target);
});
// Initialize Cropper
function cropInit(selector) {
    c = document.getElementById(selector);

    if (cropperImageInitCanvas.cropper) {
        cropperImageInitCanvas.cropper.destroy();
    }
    var allCloseButtons = document.querySelectorAll('.singleImageCanvasCloseBtn');
    for (let element of allCloseButtons) {
        element.style.display = 'block';
    }
    c.previousSibling.style.display = 'none';
    // c.id = croppedImg;
    var ctx = c.getContext('2d');
    var imgData = ctx.getImageData(0, 0, c.width, c.height);
    var image = cropperImageInitCanvas;
    image.width = c.width;
    image.height = c.height;
    var ctx = image.getContext('2d');
    ctx.putImageData(imgData, 0, 0);

    cropper = new Cropper(image, {
        aspectRatio: 5 / 6,
        viewMode: 4,
        preview: '.img-preview',
        crop: function (event) {
            cropImageButton.style.display = 'block';
        }
    });

}

function image_crop() {
    if (cropperImageInitCanvas.cropper) {
        var cropcanvas = cropperImageInitCanvas.cropper.getCroppedCanvas({
            width: 250, height: 250
        });
        // document.getElementById('cropImages').appendChild(cropcanvas);
        var ctx = cropcanvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, cropcanvas.width, cropcanvas.height);
        // var image = document.getElementById(c);
        c.width = cropcanvas.width;
        c.height = cropcanvas.height;
        var ctx = c.getContext('2d');
        ctx.putImageData(imgData, 0, 0);
        cropperImageInitCanvas.cropper.destroy();
        cropperImageInitCanvas.width = 0;
        cropperImageInitCanvas.height = 0;
        cropImageButton.style.display = 'none';
        var allCloseButtons = document.querySelectorAll('.singleImageCanvasCloseBtn');
        for (let element of allCloseButtons) {
            element.style.display = 'block';
        }
        urlConversion();
    } else {
        alert('Please select any Image you want to crop');
    }
}
cropImageButton.addEventListener("click", function () {
    image_crop();
});
// Image Close/Remove
function removeSingleCanvas(selector) {
    selector.parentNode.remove();
    urlConversion();
}

function urlConversion() {
    var allImageCanvas = document.querySelectorAll('.singleImageCanvas');
    var convertedUrl = '';
    canvasLength = allImageCanvas.length;
    for (let element of allImageCanvas) {
        convertedUrl += element.toDataURL('image/jpeg');
        convertedUrl += 'img_url';
    }
    document.getElementById('post_img_data').value = convertedUrl;
}

        function validatePostMedia(files) {

            $('#imageValidate').empty();
        let err = 0;
        let ResponseTxt = '';
    if (files.length > 10) {
            err += 1;
        ResponseTxt += '<p> You can select maximum 10 files. </p>';
    }
        $(files).each(function (index, file) {
      if (file.size > 1048576) {
            err += 1;
        ResponseTxt += 'File : ' + file.name + ' is greater than 1MB';
      }
    });

    if (err > 0) {
            $('#imageValidate').html(ResponseTxt);
        return false;
    }
        return true;

  }


  $('#imgcrop').on('click', function(e) {
    if (e.target !== this)
    return;
    
    imgcrop.hidden=true
  });