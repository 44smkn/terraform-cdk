import { Construct } from "constructs";
import { Vpc } from "./.gen/modules/terraform-aws-modules/aws/vpc";

/**
 * Provision vpcs for EKS Cluster
 * @param scope The scope in which to define this construct
 * @param region The AWS region where you want to provision EKS cluster
 * @returns vpc module
 */
export function provisionVpcModule(scope: Construct, region: string): Vpc {
    return new Vpc(scope, "vpc", {
        name: "eks",
        cidr: "10.0.0.0/16",
        azs: ["a", "c", "d"].map((i) => `${region}${i}`),
        privateSubnets: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
        publicSubnets: ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"],
        enableNatGateway: true,
        singleNatGateway: true,
        enableDnsHostnames: true,
    })
}