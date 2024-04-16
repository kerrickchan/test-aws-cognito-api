import { AdminGetUserCommand, AdminUserGlobalSignOutCommand, CognitoIdentityProviderClient, GetUserCommand, GetUserCommandInput } from '@aws-sdk/client-cognito-identity-provider';
import AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import express, { Request, Response } from "express";
import ViteExpress from "vite-express";

const app = express();
const client = new CognitoIdentityProviderClient({ region: "us-west-2" });

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

app.get("/user/:username", async (req: Request, res: Response) => {
  const UserPoolId = '' // TODO: add your user pool id
  const ClientId = '' // TODO: add your client id
  const Username = 'tester';
  const Password = 'P@ssw0rd!'

  const getUserRes = await client.send(new AdminGetUserCommand({
    UserPoolId,
    Username: req.params.username,
  }));
  console.log('getUserRes', getUserRes);


  const authenticationData = {
    Username,
    Password,
  };
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  const poolData = {
    UserPoolId,
    ClientId,
  };
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  const userData = {
    Username,
    Pool: userPool
  };
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: async function (result) {
      const accessToken = result.getAccessToken().getJwtToken();
      console.log('accessToken', accessToken);

      /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer */
      const idToken = result.getIdToken()
      console.log('idToken', idToken);

      const signoutUserRes = await client.send(new AdminUserGlobalSignOutCommand({
        UserPoolId,
        Username,
      }));
      console.log('signoutUserRes', signoutUserRes);

      const getDataAgain = await client.send(new GetUserCommand({
        AccessToken: accessToken,
      }));
      console.log('getDataAgain', getDataAgain);

      res.json({ getUserRes, signoutUserRes, accessToken, idToken });
    },

    onFailure: function (err) {
      console.error(err);
    },

  });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
