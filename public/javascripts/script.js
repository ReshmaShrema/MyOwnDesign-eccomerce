// show the number to table

var table_row = document.querySelectorAll("tbody > tr");

for (i in table_row) {
  let n = parseInt(i) + 1;
  var th = table_row[i].children[0];
  th.innerHTML = n;
}



// ajax for cart number indication
function addTocart(proId) {
  console.log("ajax working");
  $.ajax({
    url: '/add-to-cart/'+proId,
    method: 'get',
    success: (response) => { 
      if(response.status){
         let count=$('#cart-count').html()
         count = parseInt(count)+1
         console.log(count)
         $("#cart-count").html(count)
      }
      
    },
  });
}


// add to wish list ajax

function addToWishlist(proId) {
  console.log("Wishlist ajax working");
  $.ajax({
    url: '/add-to-Wishlist/'+proId,
    method: 'get',
    success: (response) => { 
      if(response.status){
         let count=$('#wish-count').html()

   
         count = parseInt(count)+1
         console.log("the count is +"+count)
         $("#wish-count").html(count)
      }
      
    },
  });
}



//Add or remove the style

