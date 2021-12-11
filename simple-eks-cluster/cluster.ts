import { Construct } from "constructs";
import { EKS, IAM } from "./.gen/providers/aws";

export function provisionEksCluster(scope: Construct, clusterName: string, privateSubnets: string[] | undefined): EKS.EksCluster {
    const assumeRolePolicy = new IAM.DataAwsIamPolicyDocument(scope, "eks_cluster_assume_role_policy", {
        statement: [{
            effect: "Allow",
            principals: [
                {
                    type: "Service",
                    identifiers: ["eks.amazonaws.com"],
                }
            ],
            actions: ["sts:AssumeRole"],
        }]
    })

    const clusterIamRole = new IAM.IamRole(scope, "cluster_iam_role", {
        name: clusterName,
        assumeRolePolicy: assumeRolePolicy.json,
    })

    if (clusterIamRole.name == null) {
        throw Error("cluster_iam_role doesn't have name property")
    }

    new IAM.IamRolePolicyAttachment(scope, "eks_cluster_policy", {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
        role: clusterIamRole.name,
    })

    // enable Security Groups for Pods
    new IAM.IamRolePolicyAttachment(scope, "eks_vpc_resource_controller_policy", {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController",
        role: clusterIamRole.name,
    })

    if (privateSubnets == null) {
        throw Error("vpc doesn't have privateSubnets property");
    }

    return new EKS.EksCluster(scope, "eks_cluster", {
        name: clusterName,
        roleArn: clusterIamRole.arn,
        vpcConfig: {
            subnetIds: privateSubnets,
            // https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html#modify-endpoint-access
            endpointPrivateAccess: true,
            endpointPublicAccess: true,
        },
        version: "1.21",
    });

}