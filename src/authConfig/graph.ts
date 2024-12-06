import { graphConfig } from "./authConfig";
import { graphImageConfig } from "./authConfig";

/**
 * Attaches a given access token to a MS Graph API call. Returns information about the user
 * @param accessToken 
 */

import axios from 'axios';
export const callMsGraph = async (accessToken: string) => {
  try {
    const response = await axios.get(graphConfig.graphMeEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
        return response; // Assuming you're interested in the data portion of the response

  } catch (error: any) {
    // Handling specific HTTP error responses
    if (error.response && error.response.status === 404) {
      console.log("No data");
      return null; 
    } else {
      console.error('An error occurred', error);
      throw error; // Rethrow the error for higher-level handling
    }
  }
};

export const callMsGraphImage = async (accessToken: string) => {
  try {
    const response = await axios.get(graphImageConfig.graphMePhotoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'blob', 
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("Profile image not found");
      return null; 
    } else {
      console.error('Error fetching profile image:', error);
      throw error;
    }
  }
};








// export const callMsGraphImage = async (accessToken: string) => {
//   try {
//     const response = await axios.get(graphImageConfig.graphMePhotoEndpoint, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//       responseType: 'blob', 
//     });
//     return response.data;
//   } catch (error: any) {
//     if (error.response && error.response.status === 404) {
//       console.log("Profile image not found");
//       return null; 
//     } else {
//       console.error('Error fetching profile image:', error);
//       throw error;
//     }
//   }
// };



