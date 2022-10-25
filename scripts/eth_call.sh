goerliUrl=`cat ".env" | sed -n 's/GOERLI_RPC_URL=//p'`


echo "goerli:"
curl -X POST \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"from":"0xA075651ea838A246346Eb5A2766679FA4Fe59d83","to":"0xA94382529d864a7a4f50cD5294902EEc791c9ff5","data":"0x4871fed6"}],"id":1}' \
  -H 'Content-Type: application/json' \
  $goerliUrl


echo "\n\nuniquerc:"
curl -X POST \
  --data '{"jsonrpc":"2.0","method":"eth_call","params":[{"from":"0xA075651ea838A246346Eb5A2766679FA4Fe59d83","to":"0xA94382529d864a7a4f50cD5294902EEc791c9ff5","data":"0x4871fed6"}],"id":1}' \
  -H 'Content-Type: application/json' \
  https://rpc-opal.unique.network

echo "\n"
