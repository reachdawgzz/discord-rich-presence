using UnityEngine;
using Discord.Sdk;

public class DiscordRichPresence : MonoBehaviour
{
    // Replace this number with your Application ID from the Discord Developer Portal
    [SerializeField] private ulong applicationId = 1573413285296996544;

    private Client client;

    private void Start()
    {
        client = new Client();
        client.SetApplicationId(applicationId);
        UpdatePresence(client);
    }

    private void Update()
    {
        if (client != null)
        {
            client.RunCallbacks();
        }
    }

    private void UpdatePresence(Discord.Sdk.Client client)
    {
        var activity = new Discord.Sdk.Activity();
        activity.SetType(Discord.Sdk.ActivityTypes.Listening);
        activity.SetDetails("eeeeeeeee");
        activity.SetState("On an adventure");

        var timestamps = new Discord.Sdk.ActivityTimestamps();
        timestamps.SetStart(1795200628UL);
        timestamps.SetEnd(1906800628UL);
        activity.SetTimestamps(timestamps);

        var assets = new Discord.Sdk.ActivityAssets();
        assets.SetLargeText("Enchanted Forest");
        assets.SetSmallText("Level 10");
        activity.SetAssets(assets);

        var button1 = new Discord.Sdk.ActivityButton();
        button1.SetLabel("gunslol");
        button1.SetUrl("https://guns.lol/reachdawg");
        activity.AddButton(button1);

        client.UpdateRichPresence(activity, (Discord.Sdk.ClientResult result) => {
            if (!result.Successful()) {
                UnityEngine.Debug.LogError("Failed to update Rich Presence");
            }
        });
    }

    private void OnDestroy()
    {
        client?.Dispose();
    }
}

