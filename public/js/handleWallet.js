function handleWalletPayment(data) {
    if (data) {
      const walletBalance = data.walletBalance;
      const orderAmount = data.paymentAmount;
  
      if (walletBalance === 0) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Your wallet balance is 0. Please add funds to your wallet.",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      } else if (walletBalance < orderAmount) {
        Swal.fire({
          title: "Partial Payment",
          text: `You have only ${walletBalance} in your wallet. Would you like to make a partial payment with your wallet?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#ffc107",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Make Partial Payment",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Confirm Deduction",
              text: `Are you sure you want to deduct ${walletBalance} from your wallet balance for the partial payment?`,
              icon: "question",
              showCancelButton: true,
              confirmButtonColor: "#ffc107",
              cancelButtonColor: "#6c757d",
              confirmButtonText: "Yes, Deduct",
              cancelButtonText: "Cancel",
            }).then((deductionResult) => {
              if (deductionResult.isConfirmed) {
                fetch("/deductWalletBalanceForPartialPayment", {
          method: "POST",
          body: JSON.stringify({ amount: walletBalance }),
          headers: {
            "Content-Type": "application/json",
          },
        }).then((deductionResponse) => deductionResponse.json())
                  .then((deductionData) => {
                    if (deductionData.success) {
                      Swal.fire({
                        icon: "success",
                        title: "Deduction Successful!",
                        text: `You have successfully deducted ${walletBalance} from your wallet.`,
                      }).then(() => {
                        const restAmount = orderAmount - walletBalance;
                        Swal.fire({
                          title: "Remaining Amount",
                          text: `You still need to pay ${restAmount}. Choose your Preferable Payment option?`,
                          icon: "question",
                          showCancelButton: true,
                          confirmButtonColor: "#ffc107",
                          cancelButtonColor: "#6c757d",
                          confirmButtonText: "Yes, Proceed with RazorPay",
                         
                        }).then((paymentOptionResponse) => {
                          console.log(restAmount)
                          if (paymentOptionResponse.isConfirmed) {
                            fetch("/orderConfirmation", {
                              method: "POST",
                              body: JSON.stringify({
                                flexRadioDefault: "RAZORPAY",
                                amount:restAmount ,
                              }),
                              headers: {
                                "Content-Type": "application/json",
                              },
                            })
                              .then((response) => response.json())
                              .then((data) => {
                                if (data.success) {
  
                var options = {
                key: "" + data.key_id + "",
                amount: "" + data.amount + "",
                currency: "INR",
                name: "StyleSync",
                description: "Synced in style,Tailored for you",
                image: "https://i.postimg.cc/L803rJyj/Style-Sync.png",
                order_id: "" + data.order_id + "", 
                handler: function (response) {
                  const redirectUrl = `/placeOrder?amount=${data.amount}&paymentMethod=RAZORPAY`;;
                    
                  window.location.href = redirectUrl;
                },
                prefill: {
                  name: "" + data.name + "", 
                  email: "" + data.email + "",
                  contact: "9000090000", 
                },
                notes: {
                  address: "Razorpay Corporate Office",
                },
                theme: {
                  color: "#ffc107",
                },
              };
              var rzp1 = new Razorpay(options);
              rzp1.on("payment.failed", function (response) {
                alert("Payment Failed");
              });
              rzp1.open();
  
  
                                } else {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Error",
                                    text: data.message,
                                  });
                                }
                              })
                              .catch((error) => {
                                console.error("Error:", error);
                                Swal.fire({
                                  icon: "error",
                                  title: "Error",
                                  text: "Error processing Razorpay payment.",
                                });
                              });
                          } else {
                            fetch("/orderConfirmation", {
                              method: "POST",
                              body: JSON.stringify({
                                flexRadioDefault: "COD",
                              }),
                              headers: {
                                "Content-Type": "application/json",
                                remainingAmount: restAmount,
                              },
                            })
                              .then((response) => response.json())
                              .then((data) => {
                                if (data.success) {
                                  window.open("/paymentSuccess", "_self");
                                } else {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Error",
                                    text: data.message,
                                  });
                                }
                              })
                              .catch((error) => {
                                console.error("Error:", error);
                                Swal.fire({
                                  icon: "error",
                                  title: "Error",
                                  text: "Error processing COD payment.",
                                });
                              });
                          }
                        });
                      });
                    } else {
                      Swal.fire({
                        icon: "error",
                        title: "Deduction Failed",
                        text: deductionData.message,
                      });
                    }
                  });
              }
            });
          }
        });
      } else if (walletBalance >= orderAmount) {
        fetch("/deductWalletBalance", {
          method: "POST",
          body: JSON.stringify({ amount: orderAmount }),
          headers: {
            "Content-Type": "application/json",
          },
        }).then((response) => response.json())
          .then((walletData) => {
            if (walletData.success) {
              Swal.fire({
                icon: "success",
                title: "Payment Successful",
                text: "Your order has been placed successfully! ",
                text: `Your new Wallet Balance is RS: ${walletData.wallet}`
              }).then(() => {
                window.open("/paymentSuccess", "_self");
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Payment Failed",
                text: walletData.message,
              });
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Error processing wallet payment.",
            });
          });
      }
    }
  }