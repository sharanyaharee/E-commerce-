
  async function showOrderDetails(orderId) {
    console.log("showOrderDetails called");
    fetch("/admin/getOrderDetails/" + orderId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const orderDetailsContent = document.getElementById("orderDetailsContent");
          if (orderDetailsContent) {
            // Customize this part based on your order details structure
            orderDetailsContent.innerHTML = `<p>Order ID: ${data.order._id}</p>
                                            <p>User: ${data.order.userId.name}</p>
                                            <p>Total Amount: ${data.order.totalAmount}</p>
                                            <p>Order Date: ${data.order.orderDate.toLocaleDateString()}</p>
                                            <!-- Add more details as needed -->`;
          }

          const orderDetailsSection = document.getElementById("orderDetailsSection");
          if (orderDetailsSection) {
            orderDetailsSection.style.display = "block"; // Show the modal
          }
        } else {
          console.error("Failed to fetch order details:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
      });
  }

  function closeOrderDetailsSection() {
    const orderDetailsSection = document.getElementById("orderDetailsSection");
    if (orderDetailsSection) {
      orderDetailsSection.style.display = "none"; // Hide the modal
    }
  }

