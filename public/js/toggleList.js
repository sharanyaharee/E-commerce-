
// async function toggleBlock(endpoint, Id) {
//   try {
//     const response = await fetch(endpoint + Id, {
//       method: 'POST',
//     });

//     if (response.ok) {
     
//       const button = document.querySelector(`#toggleButton-${Id}`);
//       if (button) {
//         const data = await response.json();
//         if (data.blocked) {
//           button.innerText = 'UnListed';
//         } else {
//           button.innerText = 'Listed';
//         }
//       }
//     } else {
//       console.error('Failed to toggle block status:', response.statusText);
//     }
//   } catch (error) {
//     console.error('Error toggling block status:', error);
//   }
// }


function toggleBlock(endpoint, Id) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You are about to change the product status. This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, change status!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(endpoint + Id, {
        method: 'POST',
      }).then(response => response.json())
      .then(data => {
        
      const button = document.querySelector(`#toggleButton-${Id}`);
      if (button) {
        
        if (data.blocked) {
          button.innerText = 'UnListed';
        } else {
          button.innerText = 'Listed';
        }
      }
        Swal.fire(
          'Status Changed!',
          'Product status has been updated.',
          'success'
        );
      
      })
      .catch(error => {
        Swal.fire(
          'Error!',
          'Error occured while changing product status.',
          'error'
        );
      });
    }
  });
}
