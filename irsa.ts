import { Construct } from "constructs";
import { TlsProvider, DataTlsCertificate } from "./.gen/providers/tls"
import { EKS, IAM } from "./.gen/providers/aws";

/**
 * Enable IAM Role for Service Account
 * ref: {@link https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eks_cluster#enabling-iam-roles-for-service-accounts enabling-iam-roles-for-service-accounts}
 *
 * @param scope The scope in which to define this construct
 * @param cluster Target EKS Cluster
 */
export function enableIamRoleForServiceAccount(scope: Construct, cluster: EKS.EksCluster) {
    const oidc: EKS.EksIdentityProviderConfigOidc = cluster.identity("0").oidc;

    new TlsProvider(scope, "tls");
    const tlsCertificate = new DataTlsCertificate(scope, "eks_cluster_tls_certificate", {
        url: oidc.issuerUrl,
    });

    const oidcProvider = new IAM.IamOpenidConnectProvider(scope, "eks_cluster_oidc", {
        clientIdList: ["sts.amazonaws.com"],
        thumbprintList: [tlsCertificate.certificates("0").sha1Fingerprint],
        url: oidc.issuerUrl,
    });

    // https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/cni-iam-role.html
    const eksAWSNodePolicy = new IAM.DataAwsIamPolicyDocument(scope, "eks_aws_cni_role_policy", {
        statement: [{
            actions: ["sts:AssumeRoleWithWebIdentity"],
            effect: "Allow",
            condition: [{
                test: "StringEquals",
                variable: oidcProvider.url.replace("https://", "") + ":sub",
                values: ["system:serviceaccount:kube-system:aws-node"]
            }],
            principals: [
                {
                    identifiers: [oidcProvider.arn],
                    type: "Federated",
                }
            ]
        }]
    });

    const eksAWSNodeRole = new IAM.IamRole(scope, "eks_aws_cni_role", {
        assumeRolePolicy: eksAWSNodePolicy.json,
        name: `${cluster.name}-eks-aws-node`
    })

    if (eksAWSNodeRole.name == null) {
        throw Error("eks_aws_node_role does't have name property")
    }
    new IAM.IamRolePolicyAttachment(scope, "eks_aws_node_cni_policy", {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
        role: eksAWSNodeRole.name,
    })
}