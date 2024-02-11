
const handleWalletPayment = (data, radioButtonSelectedValue) => {
  console.log("i am in handleWallet")
  if (radioButtonSelectedValue === "WALLET") {
    const walletBalance = data.walletBalance;
    const orderAmount = data.totalAmount;

    if (walletBalance < orderAmount) {
      alert("helloo")
      if (walletBalance === 0) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Your wallet balance is 0. Please add funds to your wallet.",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      } else {
        Swal.fire({
          title: "Partial Payment",
          text: `You have ${walletBalance} in your wallet. Would you like to make a partial payment with your wallet balance and pay the rest with RazorPay, or proceed with RazorPay only?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Make Partial Payment",
          cancelButtonText: "Proceed with RazorPay Only",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Confirm Deduction",
              text: `Are you sure you want to deduct ${walletBalance} from your wallet balance for the partial payment?`,
              icon: "question",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, Deduct",
              cancelButtonText: "Cancel",
            }).then((deductionResult) => {
              if (deductionResult.isConfirmed) {
                const restAmount = orderAmount - walletBalance;
                fetch("/deductWalletBalance", {
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
                        Swal.fire({
                          title: "Remaining Amount",
                          text: `You still need to pay ${restAmount} using RazorPay. Proceed with RazorPay?`,
                          icon: "question",
                          showCancelButton: true,
                          confirmButtonColor: "#3085d6",
                          cancelButtonColor: "#d33",
                          confirmButtonText: "Yes, Proceed with RazorPay",
                          cancelButtonText: "No, Cancel",
                        })

                        .then((razorPayResult) => {
                          if (razorPayResult.isConfirmed) {
                            fetch("/orderConfirmation", {
                              method: "POST",
                              body: JSON.stringify({
                                flexRadioDefault: "RAZORPAY",
                                remainingAmount: restAmount, 
                              }),
                              headers: {
                                "Content-Type": "application/json",
                              },
                            })
                            .then((response) => response.json())
                            .then((data) => {
                              var options = {
                                key: "" + data.key_id + "", 
                                amount: "" + data.amount + "", 
                                currency: "INR",
                                name: "StyleSync",
                                description: "Synced in style,Tailored for you",
                                image: "https://i.postimg.cc/L803rJyj/Style-Sync.png",
                                order_id: "" + data.order_id + "", //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                                handler: function (response) {
                                  window.open("/paymentSuccess", "_self");
                                },
                                prefill: {
                                  name: "" + data.name + "", //your customer's name
                                  email: "" + data.email + "",
                                  contact: "9000090000", //Provide the customer's phone number for better conversion rates
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
                            })
                            .catch((error) => {
                              console.error("Error:", error);
                            });
                          }
                        });
                        
                      });
                    } else {
                      alert("Failed to deduct amount from wallet.");
                    }
                  })
                  .catch((error) => {
                    console.error("Error:", error);
                  });
              }
            });
          } else {
            fetch("/orderConfirmation", {
              method: "POST",
              body: JSON.stringify({
                flexRadioDefault: "RAZORPAY", 
                remainingAmount: orderAmount, 
              }),
              headers: {
                "Content-Type": "application/json",
              },
            })
          }
        });
      }
    } else {
     
      // window.open("/paymentSuccess", "_self");
    }
  } else {
    
    alert("Failed to fetch wallet balance.");
  }
};
