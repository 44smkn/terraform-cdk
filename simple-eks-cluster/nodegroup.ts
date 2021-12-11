import { Construct } from "constructs";
import { EKS, IAM } from "./.gen/providers/aws";

/**
 * Provision Managed Node Group
 * ref: {@link https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eks_node_group}
 * @param scope The scope in which to define this construct
 * @param cluster Your target EKS Cluster
 * @retruns node group
 */
export function provisionManagedNodeGroup(scope: Construct, cluster: EKS.EksCluster): EKS.EksNodeGroup {
    const assumeRolePolicy = new IAM.DataAwsIamPolicyDocument(scope, "eks_mng_assume_role_policy", {
        statement: [{
            effect: "Allow",
            principals: [
                {
                    type: "Service",
                    identifiers: ["ec2.amazonaws.com"]
                }
            ],
            actions: ["sts:AssumeRole"]
        }]
    })

    const eksNodeRole = new IAM.IamRole(scope, "eks_mng_role", {
        name: "eks-node-group-role",
        assumeRolePolicy: assumeRolePolicy.json
    })

    if (eksNodeRole.name == null) {
        throw new Error("eks_mng_role doesn't have name property")
    }
    new IAM.IamRolePolicyAttachment(scope, "eks_workernode_policy", {
        policyArn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
        role: eksNodeRole.name,
    })
    new IAM.IamRolePolicyAttachment(scope, "eks_read_ecr_policy", {
        policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
        role: eksNodeRole.name,
    })

    return new EKS.EksNodeGroup(scope, "eks_mng_default", {
        clusterName: cluster.name,
        nodeGroupName: "default",
        nodeRoleArn: eksNodeRole.arn,
        subnetIds: cluster.vpcConfig.subnetIds,
        amiType: "AL2_x86_64",
        instanceTypes: ["m5.large"],
        capacityType: "SPOT",

        scalingConfig: {
            desiredSize: 1,
            maxSize: 2,
            minSize: 1,
        },

        // https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eks_node_group#ignoring-changes-to-desired-size
        lifecycle: {
            ignoreChanges: ["[scaling_config[0].desired_size]"]
        }
    })
}