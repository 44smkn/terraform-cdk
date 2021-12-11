import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "./.gen/providers/aws";
import { provisionVpcModule } from "./network"
import { enableIamRoleForServiceAccount } from "./irsa"
import { provisionManagedNodeGroup } from "./nodegroup"
import { provisionEksCluster } from "./cluster"

interface EKSClusterStackConfig {
  region?: string;
  clusterName: string;
}
export class EKSClusterStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: EKSClusterStackConfig) {
    super(scope, name);

    const { region = "ap-northeast-1" } = config;
    new AwsProvider(this, "aws", {
      region: region,
    });

    const vpc = provisionVpcModule(this, region);
    const cluster = provisionEksCluster(this, config.clusterName, vpc.privateSubnets);
    enableIamRoleForServiceAccount(this, cluster);
    provisionManagedNodeGroup(this, cluster);

    new TerraformOutput(this, "eks_cluster_endpoint", {
      value: cluster.endpoint
    })
  }
}

const app = new App({
  stackTraces: true
});
new EKSClusterStack(app, "simple-eks-cluster-stack", { clusterName: "simple-eks-cluster" });
app.synth();
