document.addEventListener("DOMContentLoaded", function () {
    const couponForm = document.getElementById('couponForm');
    
    couponForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const couponCode = document.getElementById('couponCode').value;
      const totalCartAmount = parseFloat(document.getElementById('totalCartAmountInput').value);
  
      fetch('/validateCoupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          couponCode: couponCode,
          totalCartAmount: totalCartAmount
        })
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Swal.fire({
            title: `${data.couponCode} Coupon is Valid!`,
            text: `Discount Amount: ${data.discountAmount}`,
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Apply"
          }).then((result) => {
            if (result.isConfirmed) {
              fetch('/applyCoupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  couponCode: couponCode,
                  totalCartAmount: totalCartAmount
                })
              })
              .then((applyCouponResponse) => applyCouponResponse.json())
              .then((applyCouponData) => {
                if (applyCouponData.success) {
                  Swal.fire({
                    title: "Coupon Applied!",
                    text: `Amount: ${applyCouponData.discountAmount} has been deducted from your cart Amount`,
                    icon: "success",
                    confirmButtonText: "OK"
                  }).then(() => {
                   document.getElementById('totalCartAmount').innerText = `₹${applyCouponData.newCartTotal}`;
                   document.getElementById('discountAmount').innerText = `₹${applyCouponData.discountAmount}`;
                   document.getElementById('couponCode').value = '';
                                    
                  });
                } else {
                  Swal.fire({ 
                    title: 'Error',
                    text: applyCouponData.message,
                    icon: 'error',
                  })
                }
              })
              .catch((error) => {
                console.error('Error applying coupon:', error);
                displayCouponError('An error occurred while applying the coupon.');
              });
            }
          });
        } else {
          Swal.fire({ 
            title: 'Error',
            text: data.message,
            icon: 'error',
          })
        }
      })
      .catch((error) => {
        console.error('Error validating coupon:', error);
        displayCouponError('An error occurred while validating the coupon.');
      });
    });
  });
  