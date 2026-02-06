import {kafka } from 'kafkajs'

const topics=[]

class authService{
    constructor()
    {
        this.kafka = new kafka({
            clientId : 'auth-service',
            brokers : ["localhost:9094"]
        });

        this.consumer = this.kafka.consumer({groupId: "auth-service-group"});
    }

    async connect()
    {
        await this.consumer.connect();
        console.log("Auth consumer service connected ");

        await this.consumer.subscribe({
            topics,
            fromBeginning : true,
        });

        console.log(`Consumer subscribed to topics : ${topics}`);


        await this.consumer.run({
            eachMessage: async ({message , partition , topic}) =>{
                console.log(`topic : ${topic}, partition : ${partition} , offset : ${message.offset}`);

                try {
                    const orderData= JSON.parse(message.value.toString());
                } catch (error) {
                    console.log(`order processing error : ${error}`);
                }
            }
        });


    }

    async disconnect()
    {
        await this.consumer.disconnect();
    }
}